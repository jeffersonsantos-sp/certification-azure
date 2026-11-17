#!/usr/bin/env bash
set -euo pipefail

git config core.hooksPath .githooks
chmod +x .githooks/pre-commit scripts/scan_secrets.py
python3 scripts/scan_secrets.py --all
printf 'Pre-commit secret scanning installed.\n'
