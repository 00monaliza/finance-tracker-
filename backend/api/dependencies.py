from fastapi import Header, HTTPException
from typing import Optional


def get_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-Id")) -> int:
    """
    Get user_id from X-User-Id header.
    For development, defaults to 1 if header is missing.
    In production, should raise 401 if missing.
    """
    if x_user_id:
        try:
            return int(x_user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user_id header")

    # Development fallback - remove in production!
    return 1

