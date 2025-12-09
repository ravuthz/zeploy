from database import Database
from models import Base

def setup_database():
    db = Database()
    print("Creating database tables...")
    db.create_tables()
    print("✅ Database setup complete!")

if __name__ == "__main__":
    setup_database()