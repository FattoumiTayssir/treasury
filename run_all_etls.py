#!/usr/bin/env python3
"""
ETL Entrypoint - Runs all Treasury ETLs in parallel with comprehensive logging
Directly upserts to PostgreSQL database
"""
import asyncio
import logging
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('etl_execution.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ETL configurations - now using DB upsert scripts
ETL_SCRIPTS = [
    {
        'name': 'Achat Importation',
        'script': 'etl_jobs/achat_importation_upsert.py',
        'description': 'Import purchases (invoices starting with CE)'
    },
    {
        'name': 'Ventes Locales',
        'script': 'etl_jobs/ventes_locales_upsert.py',
        'description': 'Local sales'
    },
    {
        'name': 'Achats Locaux avec Échéance',
        'script': 'etl_jobs/achats_locaux_echeance_upsert.py',
        'description': 'Local purchases with due dates'
    }
]


async def run_etl_script_async(etl_config: Dict) -> Dict:
    """
    Run an ETL script asynchronously and return result dict
    """
    etl_name = etl_config['name']
    script_path = etl_config['script']
    description = etl_config.get('description', '')
    
    logger.info("")
    logger.info("-" * 80)
    logger.info(f"Starting ETL: {etl_name}")
    logger.info(f"Description: {description}")
    logger.info(f"Script: {script_path}")
    logger.info("-" * 80)
    
    # Check if script exists
    if not Path(script_path).exists():
        logger.error(f"Script not found: {script_path}")
        return {
            'name': etl_name,
            'success': False,
            'error': 'Script not found',
            'duration': 0
        }
    
    start_time = time.time()
    try:
        # Run ETL script asynchronously
        process = await asyncio.create_subprocess_exec(
            sys.executable, script_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Wait for completion with timeout
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=600  # 10 minute timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            duration = time.time() - start_time
            logger.error(f"✗ {etl_name} timed out after {duration:.2f} seconds")
            return {
                'name': etl_name,
                'success': False,
                'error': 'ETL execution timed out (>10 minutes)',
                'duration': duration
            }
        
        duration = time.time() - start_time
        stdout_str = stdout.decode('utf-8') if stdout else ''
        stderr_str = stderr.decode('utf-8') if stderr else ''
        
        if process.returncode == 0:
            logger.info(f"✓ {etl_name} completed successfully in {duration:.2f} seconds")
            if stdout_str.strip():
                logger.info(f"  Output: {stdout_str.strip()}")
            
            return {
                'name': etl_name,
                'success': True,
                'duration': duration,
                'output': stdout_str
            }
        else:
            error_msg = stderr_str or stdout_str
            logger.error(f"✗ {etl_name} failed after {duration:.2f} seconds")
            logger.error(f"Error output:\n{error_msg}")
            
            return {
                'name': etl_name,
                'success': False,
                'error': error_msg,
                'duration': duration
            }
            
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f"✗ {etl_name} encountered error after {duration:.2f} seconds: {e}")
        return {
            'name': etl_name,
            'success': False,
            'error': f"Unexpected error: {str(e)}",
            'duration': duration
        }


async def run_all_etls_async():
    """Run all ETL scripts in parallel"""
    logger.info("=" * 80)
    logger.info("Starting ETL Pipeline Execution (Parallel Mode)")
    logger.info(f"Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"Running {len(ETL_SCRIPTS)} ETLs in parallel...")
    logger.info("=" * 80)
    
    total_start = time.time()
    
    # Run all ETLs in parallel
    tasks = [run_etl_script_async(etl_config) for etl_config in ETL_SCRIPTS]
    results = await asyncio.gather(*tasks)
    
    total_duration = time.time() - total_start
    
    # Summary report
    logger.info("")
    logger.info("=" * 80)
    logger.info("ETL Pipeline Execution Summary")
    logger.info("=" * 80)
    
    successful = sum(1 for r in results if r['success'])
    failed = len(results) - successful
    
    logger.info(f"Total ETLs: {len(results)}")
    logger.info(f"Successful: {successful}")
    logger.info(f"Failed: {failed}")
    logger.info(f"Total Execution Time: {total_duration:.2f} seconds ({total_duration/60:.2f} minutes)")
    logger.info("")
    
    # Detailed results
    for result in results:
        status = "✓ SUCCESS" if result['success'] else "✗ FAILED"
        logger.info(f"{status} | {result['name']}")
        logger.info(f"  Duration: {result['duration']:.2f}s")
        
        if not result['success']:
            error_preview = result.get('error', 'Unknown error')[:200]
            logger.info(f"  Error: {error_preview}...")
        logger.info("")
    
    logger.info("=" * 80)
    logger.info("ETL Pipeline Execution Complete")
    logger.info("Old data deleted, fresh data inserted to PostgreSQL database")
    logger.info("=" * 80)
    
    # Return exit code
    return 1 if failed > 0 else 0


def main():
    """Main entry point - runs async ETL pipeline"""
    try:
        exit_code = asyncio.run(run_all_etls_async())
        if exit_code > 0:
            logger.warning(f"⚠ Pipeline completed with failures")
        else:
            logger.info("✓ All ETLs completed successfully")
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.error("\n\nETL execution interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.exception(f"Fatal error in ETL pipeline: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
