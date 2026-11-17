from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Header, HTTPException
from jose import JWTError, jwt

from app.core.config import get_settings


@dataclass(frozen=True)
class AzurePrincipal:
    tenant_id: str
    object_id: str
    user_principal_name: str
    name: str
    expires_at: datetime


@dataclass(frozen=True)
class AzureAuthContext:
    principal: AzurePrincipal
    access_token: str = field(repr=False)


def _csv_values(raw: str) -> set[str]:
    return {value.strip().lower() for value in raw.split(",") if value.strip()}


def allowed_tenant_ids() -> set[str]:
    settings = get_settings()
    return _csv_values(settings.azure_tenant_allowlist or settings.azure_tenant_id)


def allowed_subscription_ids() -> set[str]:
    settings = get_settings()
    return _csv_values(settings.azure_subscription_allowlist)


def parse_azure_token(token: str) -> AzurePrincipal:
    try:
        claims = jwt.get_unverified_claims(token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid Azure token") from exc

    tenant_id = claims.get("tid")
    object_id = claims.get("oid")
    expires = claims.get("exp")

    if not tenant_id or not object_id or not expires:
        raise HTTPException(status_code=401, detail="Azure token is missing required claims")

    expires_at = datetime.fromtimestamp(int(expires), tz=UTC)
    if expires_at <= datetime.now(tz=UTC):
        raise HTTPException(status_code=401, detail="Azure token has expired")

    tenants = allowed_tenant_ids()
    if not tenants:
        raise HTTPException(
            status_code=503,
            detail="Azure tenant allowlist is not configured",
        )
    if tenant_id.lower() not in tenants:
        raise HTTPException(status_code=403, detail="Azure tenant is not allowed")

    return AzurePrincipal(
        tenant_id=tenant_id,
        object_id=object_id,
        user_principal_name=claims.get("upn") or claims.get("unique_name") or "",
        name=claims.get("name") or "",
        expires_at=expires_at,
    )


async def get_azure_auth(
    x_azure_authorization: Annotated[str | None, Header(alias="X-Azure-Authorization")] = None,
) -> AzureAuthContext:
    if not x_azure_authorization:
        raise HTTPException(status_code=401, detail="Missing X-Azure-Authorization header")

    scheme, _, token = x_azure_authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid Azure authorization header")

    token = token.strip()
    return AzureAuthContext(principal=parse_azure_token(token), access_token=token)
