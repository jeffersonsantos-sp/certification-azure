import re
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import User, get_current_user
from app.core.azure import (
    AzureAuthContext,
    allowed_subscription_ids,
    get_azure_auth,
)
from app.core.database import get_db
from app.models.models import AzureSettings
from app.services.azure import AzureClient, AzureClientError

router = APIRouter(prefix="/azure", tags=["azure"])

SUBSCRIPTION_ID_RE = re.compile(r"^[0-9a-fA-F-]{36}$")
DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AzureAuth = Annotated[AzureAuthContext, Depends(get_azure_auth)]


class AzureSettingsUpdate(BaseModel):
    subscription_id: str
    subscription_name: str
    resource_group_prefix: str = "rg-az104-lab"


def _settings_payload(settings: AzureSettings) -> dict:
    return {
        "tenant_id": settings.tenant_id,
        "subscription_id": settings.subscription_id,
        "subscription_name": settings.subscription_name,
        "resource_group_prefix": settings.resource_group_prefix,
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None,
    }


@router.get("/subscriptions")
async def list_subscriptions(
    current_user: CurrentUser,
    auth: AzureAuth,
):
    async with AzureClient(auth.access_token) as client:
        try:
            subscriptions = await client.list_subscriptions()
        except AzureClientError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    allowed = allowed_subscription_ids()
    items = [
        {
            "id": subscription.get("subscriptionId") or subscription.get("id", "").rsplit("/", 1)[-1],
            "name": subscription.get("displayName", ""),
            "state": subscription.get("state", ""),
            "tenant_id": subscription.get("tenantId", auth.principal.tenant_id),
        }
        for subscription in subscriptions
        if not allowed or str(subscription.get("subscriptionId", "")).lower() in allowed
    ]
    return {"tenant_id": auth.principal.tenant_id, "subscriptions": items}


@router.get("/settings")
async def get_azure_settings(
    db: DbSession,
    current_user: CurrentUser,
):
    result = await db.execute(
        select(AzureSettings).where(AzureSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    return {"settings": _settings_payload(settings) if settings else None}


@router.put("/settings")
async def save_azure_settings(
    payload: AzureSettingsUpdate,
    db: DbSession,
    current_user: CurrentUser,
    auth: AzureAuth,
):
    if not SUBSCRIPTION_ID_RE.fullmatch(payload.subscription_id):
        raise HTTPException(status_code=400, detail="Invalid subscription ID")

    allowed = allowed_subscription_ids()
    if allowed and payload.subscription_id.lower() not in allowed:
        raise HTTPException(status_code=403, detail="Subscription is not allowed")

    async with AzureClient(auth.access_token) as client:
        try:
            subscriptions = await client.list_subscriptions()
        except AzureClientError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    subscription = next(
        (
            item
            for item in subscriptions
            if str(item.get("subscriptionId", "")).lower()
            == payload.subscription_id.lower()
        ),
        None,
    )
    if subscription is None:
        raise HTTPException(status_code=403, detail="Subscription is not accessible")

    result = await db.execute(
        select(AzureSettings).where(AzureSettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    if settings is None:
        settings = AzureSettings(user_id=current_user.id)
        db.add(settings)

    settings.tenant_id = auth.principal.tenant_id
    settings.subscription_id = payload.subscription_id
    settings.subscription_name = payload.subscription_name or subscription.get("displayName", "")
    settings.resource_group_prefix = payload.resource_group_prefix
    settings.updated_at = datetime.now(UTC).replace(tzinfo=None)
    await db.commit()
    await db.refresh(settings)

    return {"settings": _settings_payload(settings)}
