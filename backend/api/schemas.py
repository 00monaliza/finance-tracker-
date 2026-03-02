from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Account schemas
class AccountBase(BaseModel):
    name: str
    bank_name: str
    balance: float
    currency: str = "₽"
    last_four: Optional[str] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    bank_name: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    last_four: Optional[str] = None


class AccountResponse(AccountBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Transfer schemas
class TransferRequest(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    currency: str = "₽"
    description: Optional[str] = None


class TransferResponse(BaseModel):
    from_account: AccountResponse
    to_account: AccountResponse


# Transaction schemas
class TransactionBase(BaseModel):
    type: str  # "expense" or "income"
    category: str
    amount: float
    currency: str = "₽"
    description: str
    account_id: Optional[int] = None


class TransactionCreate(TransactionBase):
    date: Optional[datetime] = None


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    account_id: Optional[int] = None
    date: Optional[datetime] = None


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Stats schemas
class CategoryStats(BaseModel):
    category: str
    amount: float
    percentage: float


class StatsResponse(BaseModel):
    total_expenses: float
    total_income: float
    balance: float
    expenses_by_category: dict[str, float]
    income_by_category: dict[str, float]


# Auth schemas
class SendCodeRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+7\d{10}$")


class VerifyCodeRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+7\d{10}$")
    code: str = Field(..., min_length=4, max_length=4)


class AuthResponse(BaseModel):
    user_id: int
    phone: str
    message: str

