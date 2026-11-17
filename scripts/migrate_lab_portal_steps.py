#!/usr/bin/env python3
"""Add the portal_steps JSONB column to lab_steps on existing databases."""

import asyncio
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))
sys.path.insert(0, str(PROJECT_ROOT))

from app.core.database import engine


async def main() -> None:
    async with engine.begin() as conn:
        await conn.exec_driver_sql(
            "ALTER TABLE lab_steps ADD COLUMN IF NOT EXISTS portal_steps JSONB"
        )
        await conn.exec_driver_sql(
            "UPDATE lab_steps SET portal_steps = '{}' WHERE portal_steps IS NULL"
        )


if __name__ == "__main__":
    asyncio.run(main())