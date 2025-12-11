#!/bin/sh

/Users/ravuthz/Projects/devops/zeploy/backend/venv/bin/python -m uvicorn main:app --reload --port 8000 && bun dev