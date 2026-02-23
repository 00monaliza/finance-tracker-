from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from db_models import User
from api.schemas import SendCodeRequest, VerifyCodeRequest, AuthResponse
import random

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory storage for verification codes (in production, use Redis)
verification_codes: dict[str, str] = {}


@router.post("/send-code", response_model=dict)
def send_code(request: SendCodeRequest, db: Session = Depends(get_db)):
    """Send SMS verification code (mock implementation)"""
    phone = request.phone

    # Generate 4-digit code
    code = str(random.randint(1000, 9999))
    verification_codes[phone] = code

    # In production, send SMS via service like Twilio, SMS.ru, etc.
    # For now, just log it (in production, remove this!)
    print(f"[MOCK SMS] Code for {phone}: {code}")

    return {"message": "Code sent successfully", "phone": phone}


@router.post("/verify", response_model=AuthResponse)
def verify_code(request: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Verify SMS code and create/get user"""
    phone = request.phone
    code = request.code

    # Check code
    stored_code = verification_codes.get(phone)
    if not stored_code or stored_code != code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Remove used code
    del verification_codes[phone]

    # Find or create user
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        user = User(phone=phone)
        db.add(user)
        db.commit()
        db.refresh(user)
        message = "User created successfully"
    else:
        message = "User authenticated successfully"

    return AuthResponse(
        user_id=user.id,
        phone=user.phone,
        message=message,
    )

