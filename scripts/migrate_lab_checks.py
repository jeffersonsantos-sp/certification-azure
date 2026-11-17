#!/usr/bin/env python3
"""Add newer lab check types to the PostgreSQL enum on existing databases."""

import asyncio
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.database import engine

NEW_CHECK_TYPES = (
    "policy_assignment_exists",
    "resource_lock_exists",
    "group_role_assignment_exists",
    "app_service_slot_exists",
    "backup_protected_vm_exists",
    "file_share_exists",
    "route_exists",
    "virtual_network_peering_exists",
    "load_balancer_probe_exists",
)


async def main() -> None:
    async with engine.begin() as conn:
        for value in NEW_CHECK_TYPES:
            await conn.exec_driver_sql(
                f"ALTER TYPE labchecktype ADD VALUE IF NOT EXISTS '{value}'"
            )


if __name__ == "__main__":
    asyncio.run(main())