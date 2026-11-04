#!/usr/bin/env python3
"""
Seed one example question for each advanced question format.
"""

import asyncio
import sys
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import async_session
from app.models.models import DifficultyLevel, Question, QuestionStatus

QUESTIONS = [
    {
        "skill_id": "ig-02",
        "question_type": "multiple_choice",
        "question_text": "A company wants to use Microsoft Entra ID P1 features. Which two capabilities are included in P1? (Choose two.)",
        "question_data": {},
        "options": [
            {"label": "A", "text": "Conditional Access", "is_correct": True},
            {"label": "B", "text": "Password writeback", "is_correct": True},
            {"label": "C", "text": "Identity Protection", "is_correct": False},
            {"label": "D", "text": "Access reviews", "is_correct": False},
        ],
        "correct_answer": ["A", "B"],
        "explanation": "Microsoft Entra ID P1 includes Conditional Access and password writeback. Identity Protection and Access Reviews require Microsoft Entra ID P2.",
        "difficulty": DifficultyLevel.intermediate,
        "tags": ["entra-id", "licensing"],
        "reference_url": "https://learn.microsoft.com/en-us/entra/fundamentals/licensing",
    },
    {
        "skill_id": "st-02",
        "question_type": "case_study",
        "question_text": "Which storage redundancy option should you choose?",
        "question_data": {
            "scenario": "Contoso runs a web application in the East US region. The application reads data from an Azure Storage account. The data must remain available for read access if the primary region fails, and the solution must replicate data to a secondary Azure region. Cost is a secondary concern.",
            "instructions": "Read the scenario, then select the best answer.",
        },
        "options": [
            {"label": "A", "text": "Read-access geo-redundant storage (RA-GRS)", "is_correct": True},
            {"label": "B", "text": "Geo-redundant storage (GRS)", "is_correct": False},
            {"label": "C", "text": "Zone-redundant storage (ZRS)", "is_correct": False},
            {"label": "D", "text": "Locally redundant storage (LRS)", "is_correct": False},
        ],
        "correct_answer": "A",
        "explanation": "RA-GRS replicates data to a secondary region and provides read access to the secondary endpoint. GRS also replicates to a secondary region but does not provide read access there. ZRS and LRS do not provide cross-region replication.",
        "difficulty": DifficultyLevel.intermediate,
        "tags": ["storage", "redundancy"],
        "reference_url": "https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy",
    },
    {
        "skill_id": "cm-02",
        "question_type": "drag_drop",
        "question_text": "Order the Azure CLI commands to create a Linux virtual machine and allow inbound HTTP traffic.",
        "question_data": {
            "instructions": "Place the commands in the correct execution order.",
        },
        "options": [
            {"label": "A", "text": "`az vm open-port --resource-group RG1 --name VM1 --port 80`", "is_correct": False},
            {"label": "B", "text": "`az group create --name RG1 --location eastus`", "is_correct": False},
            {"label": "C", "text": "`az vm show --resource-group RG1 --name VM1`", "is_correct": False},
            {"label": "D", "text": "`az vm create --resource-group RG1 --name VM1 --image Ubuntu2204 --generate-ssh-keys`", "is_correct": False},
        ],
        "correct_answer": ["B", "D", "A", "C"],
        "explanation": "Create the resource group first, then create the VM, open port 80 in its network security group, and finally verify the VM with az vm show.",
        "difficulty": DifficultyLevel.intermediate,
        "tags": ["virtual-machines", "azure-cli"],
        "reference_url": "https://learn.microsoft.com/en-us/azure/virtual-machines/linux/quick-create-cli",
    },
    {
        "skill_id": "st-01",
        "question_type": "hotspot",
        "question_text": "Click the option that provides private IP-based access from the virtual network to the storage account.",
        "question_data": {
            "image_url": "/hotspot-storage.svg",
            "instructions": "Click the correct area of the diagram.",
            "regions": [
                {"id": "public-endpoint", "label": "Public endpoint", "x": 37.5, "y": 9.52, "width": 25, "height": 14.29},
                {"id": "service-endpoint", "label": "Service endpoint", "x": 37.5, "y": 28.57, "width": 25, "height": 14.29},
                {"id": "private-endpoint", "label": "Private endpoint", "x": 37.5, "y": 47.62, "width": 25, "height": 14.29},
                {"id": "azure-firewall", "label": "Azure Firewall", "x": 37.5, "y": 66.67, "width": 25, "height": 14.29},
            ],
        },
        "options": [],
        "correct_answer": "private-endpoint",
        "explanation": "A private endpoint assigns a private IP address from the virtual network to the storage account, so traffic does not use the public endpoint. A service endpoint routes traffic over the Azure backbone but the storage account still uses a public IP address. Azure Firewall is a network security service, not a private endpoint.",
        "difficulty": DifficultyLevel.advanced,
        "tags": ["storage", "private-endpoint", "networking"],
        "reference_url": "https://learn.microsoft.com/en-us/azure/storage/common/storage-private-endpoints",
    },
]


async def main():
    async with async_session() as session:
        inserted = 0
        for data in QUESTIONS:
            existing = await session.execute(
                select(Question).where(Question.question_text == data["question_text"])
            )
            if existing.scalar_one_or_none():
                continue

            session.add(Question(id=uuid4(), status=QuestionStatus.approved, **data))
            inserted += 1

        await session.commit()
        print(f"Inserted {inserted} advanced format questions")


if __name__ == "__main__":
    asyncio.run(main())
