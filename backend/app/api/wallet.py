from fastapi import APIRouter, Depends, HTTPException, Body
from app.core.auth_middleware import get_current_user
from app.services.wallet import WalletService
from pydantic import BaseModel
from typing import Dict, Any, List

router = APIRouter(prefix="/api/wallet", tags=["wallet"])
wallet_service = WalletService()

class FundRequest(BaseModel):
    amount: float
    description: str

@router.get("/balance")
async def get_balance(user = Depends(get_current_user)):
    user_id = user["uid"]
    balance = wallet_service.get_balance(user_id)
    return {"balance": balance}

@router.get("/transactions")
async def get_transactions(user = Depends(get_current_user)):
    user_id = user["uid"]
    transactions = wallet_service.get_transactions(user_id)
    return transactions

@router.post("/fund")
async def fund_wallet(request: FundRequest, user = Depends(get_current_user)):
    user_id = user["uid"]
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Funding amount must be positive.")
    
    transaction_id = wallet_service.add_funds(user_id, request.amount, request.description)
    new_balance = wallet_service.get_balance(user_id)
    
    return {
        "status": "success",
        "transaction_id": transaction_id,
        "new_balance": new_balance
    }

@router.post("/authorize-spend")
async def authorize_spend(request: Dict[str, Any] = Body(...), user = Depends(get_current_user)):
    """
    To be used by the frontend to toggle if Agents can tap into this wallet.
    """
    user_id = user["uid"]
    authorized = request.get("authorized", False)
    limit = request.get("spend_limit", 0)
    
    wallet_service.set_spend_authorization(user_id, authorized, limit)
    return {"status": "success", "authorized": authorized, "limit": limit}

@router.get("/settings")
async def get_wallet_settings(user = Depends(get_current_user)):
    user_id = user["uid"]
    settings = wallet_service.get_settings(user_id)
    return settings
