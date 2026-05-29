"""Restrict API access to requests that present the admin API key."""

import os
import secrets

from dotenv import load_dotenv
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

load_dotenv()


def get_admin_api_key() -> str:
    return os.getenv("ADMIN_API_KEY", "").strip()


def extract_api_key(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header[7:].strip() or None

    api_key_header = request.headers.get("X-API-Key", "").strip()
    if api_key_header:
        return api_key_header

    if request.method == "GET":
        query_key = request.query_params.get("api_key", "").strip()
        if query_key:
            return query_key

    return None


PUBLIC_PATHS = {"/public/signup", "/public/login"}

class AdminAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        admin_api_key = get_admin_api_key()
        if not admin_api_key:
            return JSONResponse(
                status_code=503,
                content={
                    "detail": (
                        "Backend API is locked. Set ADMIN_API_KEY in Sunpost/backend/.env "
                        "and restart the server."
                    )
                },
            )

        provided_key = extract_api_key(request)
        if not provided_key or not secrets.compare_digest(provided_key, admin_api_key):
            return JSONResponse(
                status_code=401,
                content={
                    "detail": "Unauthorized. Provide your API key via Authorization: Bearer <key> or X-API-Key header."
                },
            )

        return await call_next(request)
