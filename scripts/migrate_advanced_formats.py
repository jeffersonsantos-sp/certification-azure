#!/usr/bin/env python3
"""
Add advanced question format support to an existing AZ-104 Trainer database.
"""

import asyncio
import sys
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import engine


async def main():
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS "
            "question_type varchar(32) NOT NULL DEFAULT 'single_choice'"
        ))
        await conn.execute(text(
            "ALTER TABLE questions ADD COLUMN IF NOT EXISTS "
            "question_data jsonb NOT NULL DEFAULT '{}'::jsonb"
        ))

        correct_type = await conn.scalar(text(
            "SELECT data_type FROM information_schema.columns "
            "WHERE table_name = 'questions' AND column_name = 'correct_answer'"
        ))
        if correct_type == "character varying":
            await conn.execute(text(
                "ALTER TABLE questions ALTER COLUMN correct_answer "
                "TYPE jsonb USING to_jsonb(correct_answer)"
            ))

        selected_type = await conn.scalar(text(
            "SELECT data_type FROM information_schema.columns "
            "WHERE table_name = 'user_answers' AND column_name = 'selected_answer'"
        ))
        if selected_type == "character varying":
            await conn.execute(text(
                "ALTER TABLE user_answers ALTER COLUMN selected_answer "
                "TYPE jsonb USING to_jsonb(selected_answer)"
            ))

    print("Advanced question format migration complete")


if __name__ == "__main__":
    asyncio.run(main())
