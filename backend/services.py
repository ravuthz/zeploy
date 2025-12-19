import logging
from typing import List, Optional, Dict, Any
import subprocess
import os
import asyncio
from datetime import datetime
from fastapi import WebSocket
from database import Database
from repositories import ScriptRepository, ExecutionRepository
from models import Script, Execution

logger = logging.getLogger("service")


class ScriptService:
    """Service layer for Script operations"""

    def __init__(self):
        self.db = Database()

    def get_all_scripts(
        self, tag: Optional[str] = None, search: Optional[str] = None
    ) -> List[Dict]:
        """Get all scripts"""
        with self.db.session_scope() as session:
            repo = ScriptRepository(session)
            scripts = repo.get_all(tag=tag, search=search)
            return [script.to_dict() for script in scripts]

    def get_script(self, script_id: str) -> Optional[Dict]:
        """Get a script by ID"""
        with self.db.session_scope() as session:
            repo = ScriptRepository(session)
            script = repo.get_by_id(script_id)
            return script.to_dict() if script else None

    def create_script(self, data: Dict[str, Any]) -> Dict:
        """Create a new script"""
        with self.db.session_scope() as session:
            repo = ScriptRepository(session)

            # Check if name already exists
            existing = repo.get_by_name(data.get("name"))
            if existing:
                raise ValueError(
                    f"Script with name '{data.get('name')}' already exists"
                )

            script = repo.create(data)
            return script.to_dict()

    def update_script(self, script_id: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Update an existing script"""
        with self.db.session_scope() as session:
            repo = ScriptRepository(session)

            # Check if name already exists (excluding current script)
            if "name" in data:
                existing = repo.get_by_name(data["name"])
                if existing and existing.id != script_id:
                    raise ValueError(
                        f"Script with name '{data['name']}' already exists"
                    )

            script = repo.update(script_id, data)
            return script.to_dict() if script else None

    def delete_script(self, script_id: str) -> bool:
        """Delete a script"""
        with self.db.session_scope() as session:
            repo = ScriptRepository(session)
            return repo.delete(script_id)

    def get_script_count(self) -> int:
        """Get total script count"""
        with self.db.session_scope() as session:
            repo = ScriptRepository(session)
            return repo.count()


class ExecutionService:
    """Service layer for Execution operations"""

    def __init__(self):
        self.db = Database()
        self.active_executions = {}  # script_id: (process, execution_id)

    def get_all_executions(self, script_id: Optional[str] = None) -> List[Dict]:
        """Get all executions"""
        with self.db.session_scope() as session:
            repo = ExecutionRepository(session)
            executions = repo.get_all(script_id=script_id)
            return [execution.to_dict() for execution in executions]

    def get_script(self, script_id: str) -> Optional[Dict]:
        """Get a script by ID"""
        with self.db.session_scope() as session:
            repo = ScriptRepository(session)
            script = repo.get_by_id(script_id)
            return script.to_dict() if script else None

    def get_execution(self, execution_id: str) -> Optional[Dict]:
        """Get an execution by ID"""
        with self.db.session_scope() as session:
            repo = ExecutionRepository(session)
            execution = repo.get_by_id(execution_id)
            return execution.to_dict() if execution else None

    def create_execution(self, script_id: str, script_name: str) -> str:
        """Create a new execution record"""
        with self.db.session_scope() as session:
            repo = ExecutionRepository(session)
            execution = repo.create(
                {
                    "script_id": script_id,
                    "script_name": script_name,
                    "status": "running",
                    "output": "",
                    "error": "",
                }
            )
            return execution.id

    def update_execution(
        self, execution_id: str, data: Dict[str, Any]
    ) -> Optional[Dict]:
        """Update an execution"""
        with self.db.session_scope() as session:
            repo = ExecutionRepository(session)
            execution = repo.update(execution_id, data)
            return execution.to_dict() if execution else None

    def get_stats(self) -> Dict[str, int]:
        """Get execution statistics"""
        with self.db.session_scope() as session:
            repo = ExecutionRepository(session)
            return {
                "total_executions": repo.count_total(),
                "failed_executions": repo.count_by_status("failed"),
                "running_executions": repo.count_by_status("running"),
                "successful_executions": repo.count_by_status("completed"),
            }

    async def _stream_output(
        self, stream, websocket: WebSocket, execution_id: str, stream_type: str
    ):
        full_output = ""
        while True:
            line = await stream.readline()
            if not line:
                break
            try:
                decoded_line = line.decode("utf-8")
            except UnicodeDecodeError:
                decoded_line = line.decode("utf-8", errors="replace")
            full_output += decoded_line
            await websocket.send_json(
                {
                    "type": stream_type,
                    "data": decoded_line,
                    "execution_id": execution_id,
                }
            )
        return full_output

    async def execute_script_ws(
        self,
        websocket: WebSocket,
        script_id: str,
        script_name: str,
        script_content: str,
    ):
        """Execute a script and stream output over a WebSocket"""
        # Cancel any existing execution for this script
        if script_id in self.active_executions:
            old_process, old_execution_id = self.active_executions[script_id]
            if old_process and old_process.returncode is None:
                try:
                    old_process.terminate()
                    await old_process.wait()
                except ProcessLookupError:
                    pass
            self.update_execution(
                old_execution_id,
                {"status": "cancelled", "completed_at": datetime.utcnow()},
            )
            # Clean up old temp file
            old_temp_script = f"/tmp/script_{old_execution_id}.sh"
            if os.path.exists(old_temp_script):
                os.remove(old_temp_script)
            del self.active_executions[script_id]

        execution_id = self.create_execution(script_id, script_name)
        # await websocket.send_json(
        #     {"type": "execute", "data": execution_id, "command": script_content}
        # )

        # Send command execution message
        await websocket.send_json(
            {
                "type": "stdout",
                # "data": f"Executing script: {script_name}\n",
                "execution_id": execution_id,
            }
        )

        temp_script = f"/tmp/script_{execution_id}.sh"
        process = None

        try:
            with open(temp_script, "w") as f:
                f.write(script_content)
            os.chmod(temp_script, 0o755)

            # PS4='[DEBUG:${LINENO}] set -x
            # stdbuf -oL -eL sh deploy.sh

            process = await asyncio.create_subprocess_shell(
                f"stdbuf -oL -eL sh -x {temp_script}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env={
                    **os.environ,
                    "PS4": "\$ ",
                    # "PS4": " \n[CMD:${LINENO}] ",
                },
            )

            # Store active execution
            self.active_executions[script_id] = (process, execution_id)

            stdout_task = asyncio.create_task(
                self._stream_output(process.stdout, websocket, execution_id, "stdout")
            )
            stderr_task = asyncio.create_task(
                self._stream_output(process.stderr, websocket, execution_id, "stderr")
            )

            await asyncio.gather(stdout_task, stderr_task)
            await process.wait()  # Wait for the process to finish

            full_stdout = stdout_task.result()
            full_stderr = stderr_task.result()

            status = "completed" if process.returncode == 0 else "failed"
            self.update_execution(
                execution_id,
                {
                    "status": status,
                    "output": full_stdout,
                    "error": full_stderr,
                    "exit_code": process.returncode,
                    "completed_at": datetime.utcnow(),
                },
            )

            await websocket.send_json(
                {
                    "type": "status",
                    "data": status,
                    "execution_id": execution_id,
                }
            )

        except Exception as e:
            error_message = f"An error occurred during script execution: {str(e)}"
            self.update_execution(
                execution_id,
                {
                    "status": "failed",
                    "error": error_message,
                    "completed_at": datetime.utcnow(),
                },
            )
            await websocket.send_json(
                {"type": "error", "data": error_message, "execution_id": execution_id}
            )

        finally:
            # Remove from active executions if this is the current one
            if (
                script_id in self.active_executions
                and self.active_executions[script_id][1] == execution_id
            ):
                del self.active_executions[script_id]

            if process and process.returncode is None:
                try:
                    process.terminate()
                    await process.wait()  # Ensure process is terminated
                except ProcessLookupError:
                    pass  # Process already finished

            if os.path.exists(temp_script):
                os.remove(temp_script)
