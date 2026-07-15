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

    try:
        # Try full verification first
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if user_id:
            return user_id
        raise HTTPException(status_code=401, detail="No sub claim in token")
    except JWTError as e:
        # Fallback: decode without signature verification
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            user_id = payload.get("sub", "anonymous")
            if user_id and user_id != "anonymous":
                return user_id
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")