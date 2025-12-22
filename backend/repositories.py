from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from models import Script, Execution
from datetime import datetime


class BaseRepository(ABC):
    """Abstract base repository"""

    def __init__(self, session: Session):
        self.session = session

    @abstractmethod
    def get_all(self, **filters) -> List:
        pass

    @abstractmethod
    def get_by_id(self, id: str):
        pass

    @abstractmethod
    def create(self, data: Dict[str, Any]):
        pass

    @abstractmethod
    def update(self, id: str, data: Dict[str, Any]):
        pass

    @abstractmethod
    def delete(self, id: str) -> bool:
        pass


class ScriptRepository(BaseRepository):
    """Repository for Script operations"""

    def get_all(
        self, tag: Optional[str] = None, search: Optional[str] = None
    ) -> List[Script]:
        """Get all scripts with optional filtering"""
        query = self.session.query(Script)

        if tag:
            query = query.filter(Script.tags.contains([tag]))

        if search:
            search_filter = or_(
                Script.name.ilike(f"%{search}%"),
                Script.description.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)

        return query.order_by(Script.updated_at.desc()).all()

    def get_by_id(self, id: str) -> Optional[Script]:
        """Get script by ID"""
        return self.session.query(Script).filter(Script.id == id).first()

    def get_by_name(self, name: str) -> Optional[Script]:
        """Get script by name"""
        return self.session.query(Script).filter(Script.name == name).first()

    def create(self, data: Dict[str, Any]) -> Script:
        """Create a new script"""
        script = Script(**data)
        self.session.add(script)
        self.session.flush()
        return script

    def update(self, id: str, data: Dict[str, Any]) -> Optional[Script]:
        """Update an existing script"""
        script = self.get_by_id(id)
        if not script:
            return None

        for key, value in data.items():
            if hasattr(script, key):
                setattr(script, key, value)

        script.updated_at = datetime.utcnow()
        self.session.flush()
        return script

    def delete(self, id: str) -> bool:
        """Delete a script"""
        script = self.get_by_id(id)
        if not script:
            return False

        self.session.delete(script)
        self.session.flush()
        return True

    def count(self) -> int:
        """Count total scripts"""
        return self.session.query(func.count(Script.id)).scalar()


class ExecutionRepository(BaseRepository):
    """Repository for Execution operations"""

    def get_all(
        self, script_id: Optional[str] = None, limit: int = 100
    ) -> List[Execution]:
        """Get all executions with optional filtering"""
        query = self.session.query(Execution)

        if script_id:
            query = query.filter(Execution.script_id == script_id)

        return query.order_by(Execution.updated_at.desc()).limit(limit).all()

    def get_by_id(self, id: str) -> Optional[Execution]:
        """Get execution by ID"""
        return self.session.query(Execution).filter(Execution.id == id).first()

    def create(self, data: Dict[str, Any]) -> Execution:
        """Create a new execution record"""
        execution = Execution(**data)
        self.session.add(execution)
        self.session.flush()
        return execution

    def update(self, id: str, data: Dict[str, Any]) -> Optional[Execution]:
        """Update an existing execution"""
        execution = self.get_by_id(id)
        if not execution:
            return None

        for key, value in data.items():
            if hasattr(execution, key):
                setattr(execution, key, value)

        self.session.flush()
        return execution

    def delete(self, id: str) -> bool:
        """Delete an execution"""
        execution = self.get_by_id(id)
        if not execution:
            return False

        self.session.delete(execution)
        self.session.flush()
        return True

    def count_by_status(self, status: str) -> int:
        """Count executions by status"""
        return (
            self.session.query(func.count(Execution.id))
            .filter(Execution.status == status)
            .scalar()
        )

    def count_total(self) -> int:
        """Count total executions"""
        return self.session.query(func.count(Execution.id)).scalar()
