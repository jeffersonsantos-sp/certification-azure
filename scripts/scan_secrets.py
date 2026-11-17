#!/usr/bin/env python3
"""Scan staged or tracked files for common credential patterns."""

import argparse
import re
import subprocess
import sys
from pathlib import Path

PATTERNS = [
    ("openai_key", re.compile(r"sk-[A-Za-z0-9]{20,}")),
    ("aws_access_key", re.compile(r"AKIA[0-9A-Z]{16}")),
    ("github_token", re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,}")),
    ("azure_storage_key", re.compile(r"AccountKey=[A-Za-z0-9+/=]{40,}")),
    ("slack_webhook", re.compile(r"https://hooks\.slack\.com/services/[A-Za-z0-9/]+")),
    ("private_key", re.compile(r"-----BEGIN (?:RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b")),
    (
        "credential_assignment",
        re.compile(
            r"(?i)(?<![A-Za-z0-9])(?:api[_-]?key|secret|password|passwd|token)\b\s*[:=]\s*[\"']?"
            r"([A-Za-z0-9+/_-]{32,})[\"']?"
        ),
    ),
]

SKIP_FILES = {
    "scripts/scan_secrets.py",
}


def staged_files() -> list[str]:
    output = subprocess.check_output(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
        text=True,
    )
    return [line.strip() for line in output.splitlines() if line.strip()]


def tracked_files() -> list[str]:
    output = subprocess.check_output(["git", "ls-files"], text=True)
    return [line.strip() for line in output.splitlines() if line.strip()]


def redact(value: str) -> str:
    if len(value) <= 8:
        return "***"
    return f"{value[:4]}***{value[-2:]}"


def scan(files: list[str]) -> list[str]:
    findings: list[str] = []
    for name in files:
        if name in SKIP_FILES:
            continue
        path = Path(name)
        if not path.is_file():
            continue
        content = path.read_bytes()
        if b"\x00" in content:
            continue
        text = content.decode("utf-8", errors="replace")
        for line_number, line in enumerate(text.splitlines(), start=1):
            for label, pattern in PATTERNS:
                match = pattern.search(line)
                if not match:
                    continue
                value = match.group(1) if match.groups() else match.group(0)
                findings.append(
                    f"{name}:{line_number}: {label}: {redact(value)}"
                )
    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--staged", action="store_true")
    group.add_argument("--all", action="store_true")
    args = parser.parse_args()

    files = staged_files() if args.staged else tracked_files()
    findings = scan(files)
    if findings:
        print("Secret scan failed:", file=sys.stderr)
        for finding in findings:
            print(f"  {finding}", file=sys.stderr)
        return 1
    print(f"Secret scan passed ({len(files)} files checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())