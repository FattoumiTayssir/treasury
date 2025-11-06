"""
Data Refresh API Router
Allows administrators to refresh data from Odoo with real-time progress tracking
"""
import asyncio
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.auth_utils import get_current_admin_user
from app import models, schemas
from app.routers.supervision import create_supervision_log

router = APIRouter(prefix="/data-refresh", tags=["Data Refresh"])

# WebSocket connection manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Send message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

# ETL job configurations
ETL_JOBS = [
    {
        'name': 'Achats Importés',
        'key': 'achat_importation',
        'script': 'etl_jobs/achat_importation_upsert.py',
        'description': 'Importation des achats depuis Odoo'
    },
    {
        'name': 'Ventes Locales',
        'key': 'ventes_locales',
        'script': 'etl_jobs/ventes_locales_upsert.py',
        'description': 'Importation des ventes locales depuis Odoo'
    },
    {
        'name': 'Achats Locaux',
        'key': 'achats_locaux',
        'script': 'etl_jobs/achats_locaux_echeance_upsert.py',
        'description': 'Importation des achats locaux avec échéances'
    }
]


async def run_single_etl_job(job_config: Dict, execution_id: int, db: Session) -> Dict:
    """Run a single ETL job and return results"""
    job_name = job_config['name']
    script_path = job_config['script']
    
    # Check if script exists
    # etl_jobs is mounted at /etl_jobs in the container
    full_script_path = Path(f"/{script_path}")
    
    if not full_script_path.exists():
        return {
            'name': job_name,
            'key': job_config['key'],
            'success': False,
            'error': f'Script introuvable : {script_path}',
            'duration': 0,
            'records': 0
        }
    
    start_time = time.time()
    try:
        # Prepare environment variables for ETL script
        # Copy current environment and override with correct database host
        etl_env = os.environ.copy()
        etl_env['PGHOST'] = os.getenv('DB_HOST', 'postgres')  # Use DB_HOST from docker-compose
        etl_env['PGPORT'] = os.getenv('DB_PORT', '5432')
        
        # Run ETL script with proper environment
        process = await asyncio.create_subprocess_exec(
            sys.executable, str(full_script_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=etl_env
        )
        
        # Wait for completion with timeout
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=600  # 10 minute timeout per job
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            duration = time.time() - start_time
            return {
                'name': job_name,
                'key': job_config['key'],
                'success': False,
                'error': 'Délai dépassé : Opération trop longue (>10 minutes)',
                'duration': duration,
                'records': 0
            }
        
        duration = time.time() - start_time
        stdout_str = stdout.decode('utf-8') if stdout else ''
        stderr_str = stderr.decode('utf-8') if stderr else ''
        
        if process.returncode == 0:
            # Try to extract record count from output
            records_processed = 0
            for line in stdout_str.split('\n'):
                if 'records' in line.lower() or 'rows' in line.lower():
                    try:
                        # Look for numbers in the line
                        import re
                        numbers = re.findall(r'\d+', line)
                        if numbers:
                            records_processed = int(numbers[0])
                            break
                    except:
                        pass
            
            return {
                'name': job_name,
                'key': job_config['key'],
                'success': True,
                'duration': duration,
                'records': records_processed,
                'output': stdout_str[:500]  # Limit output size
            }
        else:
            error_msg = stderr_str or stdout_str
            return {
                'name': job_name,
                'key': job_config['key'],
                'success': False,
                'error': error_msg[:500],  # Limit error message size
                'duration': duration,
                'records': 0
            }
            
    except Exception as e:
        duration = time.time() - start_time
        return {
            'name': job_name,
            'key': job_config['key'],
            'success': False,
            'error': f"Erreur inattendue : {str(e)}",
            'duration': duration,
            'records': 0
        }


async def execute_data_refresh(execution_id: int, db_connection_string: str):
    """
    Background task to execute all ETL jobs and update progress
    """
    from app.database import SessionLocal
    db = SessionLocal()
    
    try:
        execution = db.query(models.DataRefreshExecution).filter(
            models.DataRefreshExecution.execution_id == execution_id
        ).first()
        
        if not execution:
            return
        
        total_jobs = len(ETL_JOBS)
        job_results = []
        total_records = 0
        
        # Execute each job sequentially
        for idx, job in enumerate(ETL_JOBS, 1):
            # Update progress
            progress = int((idx - 1) / total_jobs * 100)
            execution.progress_percentage = progress
            execution.current_step = job['description']
            db.commit()
            
            # Broadcast progress
            await manager.broadcast({
                'type': 'progress',
                'executionId': execution_id,
                'progressPercentage': progress,
                'currentStep': job['description'],
                'status': 'running'
            })
            
            # Run the job
            result = await run_single_etl_job(job, execution_id, db)
            job_results.append(result)
            total_records += result.get('records', 0)
            
            # If job failed, log but continue with other jobs
            if not result['success']:
                print(f"Job {job['name']} failed: {result.get('error')}")
        
        # Update final status
        all_successful = all(r['success'] for r in job_results)
        execution.status = 'completed' if all_successful else 'failed'
        execution.completed_at = datetime.now(timezone.utc)
        execution.duration_seconds = int((datetime.now(timezone.utc) - execution.started_at).total_seconds())
        execution.progress_percentage = 100
        execution.current_step = 'Toutes les sources de données ont été actualisées avec succès' if all_successful else 'Certaines sources de données ont échoué'
        execution.total_records_processed = total_records
        execution.details = {'jobs': job_results}
        
        if not all_successful:
            failed_jobs = [r['name'] for r in job_results if not r['success']]
            execution.error_message = f"Sources échouées : {', '.join(failed_jobs)}"
        
        db.commit()
        
        # Broadcast completion
        await manager.broadcast({
            'type': 'complete',
            'executionId': execution_id,
            'progressPercentage': 100,
            'status': execution.status,
            'totalRecordsProcessed': total_records,
            'details': {'jobs': job_results}
        })
        
    except Exception as e:
        # Handle unexpected errors
        execution = db.query(models.DataRefreshExecution).filter(
            models.DataRefreshExecution.execution_id == execution_id
        ).first()
        
        if execution:
            execution.status = 'failed'
            execution.completed_at = datetime.now(timezone.utc)
            execution.duration_seconds = int((datetime.now(timezone.utc) - execution.started_at).total_seconds())
            execution.error_message = f"Erreur système : {str(e)}"
            execution.progress_percentage = 0
            db.commit()
            
            await manager.broadcast({
                'type': 'error',
                'executionId': execution_id,
                'status': 'failed',
                'errorMessage': str(e)
            })
    
    finally:
        db.close()


@router.post("/start", response_model=schemas.DataRefreshStartResponse)
async def start_data_refresh(
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Start a new data refresh operation (admin only)
    Checks if another refresh is already running
    """
    # Check if there's already a running refresh
    running_execution = db.query(models.DataRefreshExecution).filter(
        models.DataRefreshExecution.status == 'running'
    ).first()
    
    if running_execution:
        starter = db.query(models.User).filter(
            models.User.user_id == running_execution.started_by
        ).first()
        
        raise HTTPException(
            status_code=409,
            detail=f"Une actualisation des données est déjà en cours. Démarrée par {starter.display_name} à {running_execution.started_at.strftime('%H:%M')}. Veuillez attendre qu'elle se termine."
        )
    
    # Create new execution record
    new_execution = models.DataRefreshExecution(
        status='running',
        started_by=current_user.user_id,
        started_at=datetime.now(timezone.utc),
        progress_percentage=0,
        current_step='Initialisation de l\'actualisation des données...',
        total_records_processed=0
    )
    
    db.add(new_execution)
    db.commit()
    db.refresh(new_execution)
    
    # Log the data refresh start
    create_supervision_log(
        db=db,
        entity_type="data_refresh",
        entity_id=new_execution.execution_id,
        action="refresh",
        user=current_user,
        description=f"Démarré l'actualisation des données depuis Odoo",
        details={
            "execution_id": new_execution.execution_id,
            "jobs": [job['name'] for job in ETL_JOBS]
        }
    )
    
    # Start background task
    from app.database import DATABASE_URL
    background_tasks.add_task(execute_data_refresh, new_execution.execution_id, str(DATABASE_URL))
    
    # Broadcast start event
    await manager.broadcast({
        'type': 'started',
        'executionId': new_execution.execution_id,
        'status': 'running',
        'startedBy': current_user.display_name,
        'startedAt': new_execution.started_at.isoformat()
    })
    
    return schemas.DataRefreshStartResponse(
        message="Actualisation des données démarrée avec succès",
        executionId=new_execution.execution_id,
        status='running'
    )


@router.get("/status", response_model=schemas.DataRefreshStatusResponse)
async def get_refresh_status(
    db: Session = Depends(get_db)
):
    """
    Get current refresh status (available to all authenticated users)
    """
    running_execution = db.query(models.DataRefreshExecution).filter(
        models.DataRefreshExecution.status == 'running'
    ).first()
    
    if not running_execution:
        return schemas.DataRefreshStatusResponse(
            isRunning=False,
            currentExecution=None
        )
    
    starter = db.query(models.User).filter(
        models.User.user_id == running_execution.started_by
    ).first()
    
    execution_response = schemas.DataRefreshExecutionResponse(
        executionId=running_execution.execution_id,
        status=running_execution.status,
        startedBy=starter.display_name if starter else "Unknown",
        startedByEmail=starter.email if starter else "",
        startedAt=running_execution.started_at.isoformat(),
        completedAt=running_execution.completed_at.isoformat() if running_execution.completed_at else None,
        durationSeconds=running_execution.duration_seconds,
        totalRecordsProcessed=running_execution.total_records_processed,
        errorMessage=running_execution.error_message,
        progressPercentage=running_execution.progress_percentage,
        currentStep=running_execution.current_step,
        details=running_execution.details
    )
    
    return schemas.DataRefreshStatusResponse(
        isRunning=True,
        currentExecution=execution_response
    )


@router.get("/history", response_model=List[schemas.DataRefreshExecutionResponse])
async def get_refresh_history(
    limit: int = 20,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get history of data refresh executions (admin only)
    """
    executions = db.query(models.DataRefreshExecution).order_by(
        desc(models.DataRefreshExecution.started_at)
    ).limit(limit).all()
    
    results = []
    for execution in executions:
        starter = db.query(models.User).filter(
            models.User.user_id == execution.started_by
        ).first()
        
        results.append(schemas.DataRefreshExecutionResponse(
            executionId=execution.execution_id,
            status=execution.status,
            startedBy=starter.display_name if starter else "Unknown",
            startedByEmail=starter.email if starter else "",
            startedAt=execution.started_at.isoformat(),
            completedAt=execution.completed_at.isoformat() if execution.completed_at else None,
            durationSeconds=execution.duration_seconds,
            totalRecordsProcessed=execution.total_records_processed,
            errorMessage=execution.error_message,
            progressPercentage=execution.progress_percentage,
            currentStep=execution.current_step,
            details=execution.details
        ))
    
    return results


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time progress updates
    Available to all authenticated users (token validation could be added)
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for any client messages
            data = await websocket.receive_text()
            # Client can send ping to keep connection alive
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)
