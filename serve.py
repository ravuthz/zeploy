import subprocess
import os
import sys

# backend_venv = os.path.join("backend", "venv", "bin", "activate")
# exec(open(backend_venv).read(), {"__file__": backend_venv})
venv_python = os.path.abspath("backend/venv/bin/python")

backend = subprocess.Popen(
    [
        # fmt: off
        venv_python, "-m",
        "uvicorn", "main:app", "--reload", "--port", "8000"
        # fmt: on
    ],
    cwd="backend",
    # env={
    #     **os.environ,
    #     "VIRTUAL_ENV": os.path.abspath("backend/venv"),
    #     "PATH": os.path.abspath("backend/venv/bin") + ":" + os.environ["PATH"],
    # },
)

frontend = subprocess.Popen(["bun", "dev"], cwd="frontend")

backend.wait()
frontend.wait()
