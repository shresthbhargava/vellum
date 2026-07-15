"""
Supabase JWT verification for FastAPI endpoints.

Verifies the Bearer token sent by the frontend (Supabase access_token)
and extracts the user_id from the 'sub' claim.
"""

from fastapi import HTTPException, Depends, Request
from jose import jwt, JWTError
from app.config import settings


async def get_current_user(request: Request) -> str:
    """
    Extract and verify Supabase JWT from Authorization header.
    Returns the user_id (sub claim).
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header[7:]  # strip "Bearer "

    if not settings.supabase_jwt_secret:
        # If no JWT secret configured, skip verification (dev mode)
        try:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("sub", "anonymous")
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")