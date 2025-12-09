from typing import List, Optional, Dict, Any
import subprocess
import os
import asyncio
from datetime import datetime
from database import Database
from repositories import ScriptRepository, ExecutionRepository
from models import Script, Execution


class ScriptService:
    """Service layer for Script operations"""
    
    def __init__(self):
        self.db = Database()
    
    def get_all_scripts(self, tag: Optional[str] = None, search: Optional[str] = None) -> List[Dict]:
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
            existing = repo.get_by_name(data.get('name'))
            if existing:
                raise ValueError(f"Script with name '{data.get('name')}' already exists")
            
            script = repo.create(data)
            return script.to_dict()
    
    def update_script(self, script_id: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Update an existing script"""
        with self.db.session_scope() as session:
            repo = ScriptRepository(session)
            
            # Check if name already exists (excluding current script)
            if 'name' in data:
                existing = repo.get_by_name(data['name'])
                if existing and existing.id != script_id:
                    raise ValueError(f"Script with name '{data['name']}' already exists")
            
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
    
    def get_all_executions(self, script_id: Optional[str] = None) -> List[Dict]:
        """Get all executions"""
        with self.db.session_scope() as session:
            repo = ExecutionRepository(session)
            executions = repo.get_all(script_id=script_id)
            return [execution.to_dict() for execution in executions]
    
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
            execution = repo.create({
                'script_id': script_id,
                'script_name': script_name,
                'status': 'running',
                'output': '',
                'error': '',
            })
            return execution.id
    
    def update_execution(self, execution_id: str, data: Dict[str, Any]) -> Optional[Dict]:
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
                'total_executions': repo.count_total(),
                'successful_executions': repo.count_by_status('completed'),
                'failed_executions': repo.count_by_status('failed'),
                'running_executions': repo.count_by_status('running'),
            }
    
    async def execute_script(self, script_id: str, script_name: str, script_content: str):
        """Execute a script asynchronously"""
        execution_id = self.create_execution(script_id, script_name)
        
        # Create temporary script file
        temp_script = f"/tmp/script_{execution_id}.sh"
        
        try:
            with open(temp_script, 'w') as f:
                f.write(script_content)
            
            os.chmod(temp_script, 0o755)
            
            # Execute script
            process = await asyncio.create_subprocess_shell(
                f"bash {temp_script}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            # Update execution record
            self.update_execution(execution_id, {
                'status': 'completed' if process.returncode == 0 else 'failed',
                'output': stdout.decode('utf-8'),
                'error': stderr.decode('utf-8'),
                'exit_code': process.returncode,
                'completed_at': datetime.utcnow()
            })
            
        except Exception as e:
            self.update_execution(execution_id, {
                'status': 'failed',
                'error': str(e),
                'completed_at': datetime.utcnow()
            })
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_script):
                os.remove(temp_script)