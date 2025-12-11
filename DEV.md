## Backend

```bash

# pip freeze > requirements.txt
# pip install -r requirements.txt
# uvicorn main:app --reload

cd backend

python -m venv venv
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn pydantic
pip install sqlalchemy psycopg2-binary
pip install python-dotenv

# Run server
uvicorn main:app --reload --port 8000

git init && git add . && git commit -m "Setup python, fastapi with postgresql"

# psql
# create database sh_manager;

```

## Frontend

```bash

# Create Vite project
bun create vite@latest frontend -- --template react-ts
cd frontend
git init && git add . && git commit -m "Init vite, react-ts template using bun"

# Install dependencies
bun add axios lucide-react
bun add dotenv

# Run dev server
bun dev



# axios lucide-react @radix-ui/react-dialog @radix-ui/react-select
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs
