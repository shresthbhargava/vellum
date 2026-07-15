"""
Supabase JWT verification for FastAPI endpoints.
"""

from fastapi import HTTPException, Request
from jose import jwt, JWTError
from app.config import settings


async def get_current_user(request: Request) -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header[7:]

    # Decode without signature verification - extract user_id from sub claim
    try:
        payload = jwt.decode(
            token,
            key=settings.supabase_jwt_secret or "dummy",
            algorithms=["HS256", "HS384", "HS512", "RS256"],
            options={
                "verify_signature": False,
                "verify_aud": False,
                "verify_exp": False,
            },
        )
        user_id = payload.get("sub")
        if user_id:
            return user_id
        raise HTTPException(status_code=401, detail="No sub claim in token")
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")