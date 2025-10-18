from fastapi import APIRouter, Query

router = APIRouter(prefix="/odoo", tags=["odoo"])

@router.get("/reference-state", response_model=dict)
def get_reference_state(
    referenceType: str = Query(...),
    reference: str = Query(...)
):
    # Mock Odoo integration
    # In production, this would call Odoo API to get the actual state
    return {"state": "En cours"}

@router.get("/check-reference", response_model=dict)
def check_reference(reference: str = Query(...)):
    # Mock Odoo reference check
    # In production, this would verify if the reference exists in Odoo
    return {
        "exists": True,
        "type": "Facture de vente",
        "state": "Payé"
    }
