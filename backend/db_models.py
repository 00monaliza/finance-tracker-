from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class TransactionType(str, enum.Enum):
    EXPENSE = "expense"
    INCOME = "income"


class ExpenseCategory(str, enum.Enum):
    FOOD = "food"
    TRANSPORT = "transport"
    HOUSING = "housing"
    ENTERTAINMENT = "entertainment"
    CLOTHING = "clothing"
    HEALTH = "health"
    COMMUNICATION = "communication"
    SUBSCRIPTIONS = "subscriptions"
    EDUCATION = "education"
    OTHER_EXPENSE = "other_expense"


class IncomeCategory(str, enum.Enum):
    SALARY = "salary"
    FREELANCE = "freelance"
    INVESTMENTS = "investments"
    GIFTS = "gifts"
    BUSINESS = "business"
    OTHER_INCOME = "other_income"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    accounts = relationship("BankAccount", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    bank_name = Column(String, nullable=False)
    balance = Column(Float, nullable=False, default=0.0)
    currency = Column(String, nullable=False, default="₽")
    last_four = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("bank_accounts.id"), nullable=True)
    type = Column(SQLEnum(TransactionType), nullable=False)
    category = Column(String, nullable=False)  # ExpenseCategory or IncomeCategory as string
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="₽")
    description = Column(String, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="transactions")
    account = relationship("BankAccount", back_populates="transactions")

