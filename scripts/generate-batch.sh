#!/bin/bash
# Batch question generation script
cd /home/devops/Downloads/azure
source venv/bin/activate

echo "Starting batch question generation..."
python scripts/generate.py --all --count 10 >> questions/generation.log 2>&1
echo "Generation completed at $(date)" >> questions/generation.log
echo "Done! Check questions/generation.log for details."
