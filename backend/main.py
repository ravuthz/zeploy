from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from database import Database
from services import ScriptService, ExecutionService

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Shell Script Manager API",
    description="REST API for managing and executing shell scripts",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
db = Database()

# Pydantic models for request/response
class ScriptCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = ""
    content: str = Field(..., min_length=1)
    tags: List[str] = []

class ScriptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None

class ScriptResponse(BaseModel):
    id: str
    name: str
    description: str
    content: str
    tags: List[str]
    created_at: str
    updated_at: str

class ExecutionResponse(BaseModel):
    id: str
    script_id: str
    script_name: str
    status: str
    output: str
    error: str
    started_at: str
    completed_at: Optional[str]
    exit_code: Optional[int]

# Initialize services
script_service = ScriptService()
execution_service = ExecutionService()


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    db.create_tables()
    print("✅ Database tables created successfully")


@app.get("/")
async def root():
    return {
        "message": "Shell Script Manager API v2.0",
        "docs": "/docs",
        "database": "PostgreSQL"
    }


# Script endpoints
@app.get("/api/scripts")
async def get_scripts(tag: Optional[str] = None, search: Optional[str] = None):
    """Get all scripts with optional filtering"""
    scripts = script_service.get_all_scripts(tag=tag, search=search)
    return {"scripts": scripts, "total": len(scripts)}


@app.get("/api/scripts/{script_id}", response_model=ScriptResponse)
async def get_script(script_id: str):
    """Get a specific script by ID"""
    script = script_service.get_script(script_id)
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script


@app.post("/api/scripts", response_model=ScriptResponse, status_code=201)
async def create_script(script: ScriptCreate):
    """Create a new script"""
    try:
        created_script = script_service.create_script(script.dict())
        return created_script
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/scripts/{script_id}", response_model=ScriptResponse)
async def update_script(script_id: str, script: ScriptUpdate):
    """Update an existing script"""
    try:
        # Only include fields that are not None
        update_data = {k: v for k, v in script.dict().items() if v is not None}
        updated_script = script_service.update_script(script_id, update_data)
        
        if not updated_script:
            raise HTTPException(status_code=404, detail="Script not found")
        
        return updated_script
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/scripts/{script_id}")
async def delete_script(script_id: str):
    """Delete a script"""
    success = script_service.delete_script(script_id)
    if not success:
        raise HTTPException(status_code=404, detail="Script not found")
    return {"message": "Script deleted successfully"}


@app.post("/api/scripts/{script_id}/execute")
async def execute_script(script_id: str):
    """(DEPRECATED) Execute a script. Use websocket instead."""
    return {"message": "This endpoint is deprecated. Please use the websocket endpoint /ws/execute/{script_id} to execute scripts."}


@app.websocket("/ws/execute/{script_id}")
async def websocket_execute(websocket: WebSocket, script_id: str):
    await websocket.accept()
    script = execution_service.get_script(script_id)

    if not script:
        await websocket.close(code=1011, reason="Script not found")
        return

    try:
        await execution_service.execute_script_ws(
            websocket,
            script_id,
            script['name'],
            script['content']
        )
    except Exception as e:
        error_message = f"An unexpected error occurred: {str(e)}"
        try:
            await websocket.send_json({"type": "error", "data": error_message})
        except Exception:
            # If sending fails, just log it or handle it silently
            print(f"Could not send error message to websocket: {error_message}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass # Websocket might be already closed

# Execution endpoints
@app.get("/api/executions")
async def get_executions(script_id: Optional[str] = None):
    """Get execution history"""
    executions = execution_service.get_all_executions(script_id=script_id)
    return {"executions": executions, "total": len(executions)}


@app.get("/api/executions/{execution_id}", response_model=ExecutionResponse)
async def get_execution(execution_id: str):
    """Get execution details"""
    execution = execution_service.get_execution(execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


# Statistics endpoint
@app.get("/api/stats")
async def get_stats():
    """Get dashboard statistics"""
    exec_stats = execution_service.get_stats()
    script_count = script_service.get_script_count()
    
    return {
        "total_scripts": script_count,
        **exec_stats
    }
