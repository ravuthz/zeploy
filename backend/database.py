from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator
import os

class Database:
    """Database connection manager using singleton pattern"""
    
    _instance = None
    _engine = None
    _session_factory = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._engine is None:
            self._initialize()
    
    def _initialize(self):
        """Initialize database connection"""
        # Database URL from environment or default
        database_url = os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:postgres@localhost:5432/shell_script_manager"
        )
        
        self._engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=False  # Set to True for SQL debugging
        )
        
        self._session_factory = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self._engine
        )
    
    @property
    def engine(self):
        return self._engine
    
    def get_session(self) -> Session:
        """Get a new database session"""
        return self._session_factory()
    
    @contextmanager
    def session_scope(self) -> Generator[Session, None, None]:
        """Provide a transactional scope for database operations"""
        session = self.get_session()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
    
    def create_tables(self):
        """Create all tables"""
        from models import Base
        Base.metadata.create_all(self._engine)
    
    def drop_tables(self):
        """Drop all tables (use with caution!)"""
        from models import Base
        Base.metadata.drop_all(self._engine)