from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from api.dependencies import get_user_id
from db_models import BankAccount
from api.schemas import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    TransferRequest,
    TransferResponse,
)

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("/", response_model=List[AccountResponse])
def get_accounts(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    """Get all accounts for the current user"""
    accounts = db.query(BankAccount).filter(BankAccount.user_id == user_id).all()
    return accounts


@router.post("/", response_model=AccountResponse, status_code=201)
def create_account(account: AccountCreate, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    """Create a new bank account"""
    db_account = BankAccount(
        user_id=user_id,
        name=account.name,
        bank_name=account.bank_name,
        balance=account.balance,
        currency=account.currency,
        last_four=account.last_four,
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    """Get a specific account"""
    account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == account_id,
            BankAccount.user_id == user_id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    account_update: AccountUpdate,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Update an account"""
    account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == account_id,
            BankAccount.user_id == user_id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    update_data = account_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}", status_code=204)
def delete_account(account_id: int, user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    """Delete an account"""
    account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == account_id,
            BankAccount.user_id == user_id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
    return None


@router.post("/transfer", response_model=TransferResponse)
def transfer_between_accounts(
    transfer: TransferRequest,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Transfer funds between two accounts of the same user."""
    if transfer.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    if transfer.from_account_id == transfer.to_account_id:
        raise HTTPException(status_code=400, detail="Source and destination accounts must be different")

    from_account = (
        db.query(BankAccount)
        .filter(BankAccount.id == transfer.from_account_id, BankAccount.user_id == user_id)
        .first()
    )
    to_account = (
        db.query(BankAccount)
        .filter(BankAccount.id == transfer.to_account_id, BankAccount.user_id == user_id)
        .first()
    )

    if not from_account or not to_account:
        raise HTTPException(status_code=404, detail="One or both accounts not found")

    if from_account.currency != to_account.currency or from_account.currency != transfer.currency:
        raise HTTPException(status_code=400, detail="Currency mismatch between accounts or transfer")

    if from_account.balance < transfer.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds on source account")

    from_account.balance -= transfer.amount
    to_account.balance += transfer.amount

    db.commit()
    db.refresh(from_account)
    db.refresh(to_account)

    return TransferResponse(
        from_account=from_account,
        to_account=to_account,
    )

