from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from database import get_db
from api.dependencies import get_user_id
from db_models import Transaction, TransactionType
from api.schemas import TransactionCreate, TransactionUpdate, TransactionResponse, StatsResponse

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    type: Optional[str] = Query(None, description="Filter by type: 'expense' or 'income'"),
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Get all transactions for the current user, optionally filtered by type"""
    query = db.query(Transaction).filter(Transaction.user_id == user_id)
    if type:
        query = query.filter(Transaction.type == type)
    transactions = query.order_by(Transaction.date.desc()).all()
    return transactions


@router.post("/", response_model=TransactionResponse, status_code=201)
def create_transaction(
    transaction: TransactionCreate,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Create a new transaction"""
    db_transaction = Transaction(
        user_id=user_id,
        account_id=transaction.account_id,
        type=TransactionType(transaction.type),
        category=transaction.category,
        amount=transaction.amount,
        currency=transaction.currency,
        description=transaction.description,
        date=transaction.date or datetime.utcnow(),
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Get a specific transaction"""
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Update a transaction"""
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_data = transaction_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "type" and value:
            value = TransactionType(value)
        setattr(transaction, field, value)

    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    user_id: int = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """Delete a transaction"""
    transaction = (
        db.query(Transaction)
        .filter(
            Transaction.id == transaction_id,
            Transaction.user_id == user_id,
        )
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(transaction)
    db.commit()
    return None


@router.get("/stats/summary", response_model=StatsResponse)
def get_stats(user_id: int = Depends(get_user_id), db: Session = Depends(get_db)):
    """Get statistics: totals, balance, and breakdown by category"""
    # Total expenses and income
    expenses = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
        )
        .scalar()
        or 0.0
    )

    income = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME,
        )
        .scalar()
        or 0.0
    )

    # Expenses by category
    expense_by_cat = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE,
        )
        .group_by(Transaction.category)
        .all()
    )

    expenses_by_category = {cat: float(total) for cat, total in expense_by_cat}

    # Income by category
    income_by_cat = (
        db.query(
            Transaction.category,
            func.sum(Transaction.amount).label("total"),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.INCOME,
        )
        .group_by(Transaction.category)
        .all()
    )

    income_by_category = {cat: float(total) for cat, total in income_by_cat}

    return StatsResponse(
        total_expenses=float(expenses),
        total_income=float(income),
        balance=float(income - expenses),
        expenses_by_category=expenses_by_category,
        income_by_category=income_by_category,
    )

