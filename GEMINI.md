# GEMINI.md

This document provides an overview of the Zeploy project, a web application for managing and executing shell scripts.

## Project Overview

Zeploy is a full-stack application with a React frontend and a Python (FastAPI) backend. It allows users to create, manage, and execute shell scripts through a web interface. The application provides features for script creation, editing, deletion, and execution, as well as viewing execution history and statistics.

## Technologies Used

### Backend

- **Framework:** FastAPI
- **Language:** Python
- **Database:** PostgreSQL
- **Server:** Uvicorn
- **Libraries:**
  - `psycopg2-binary` for PostgreSQL connection
  - `python-dotenv` for environment variable management
  - `SQLAlchemy` for ORM

### Frontend

- **Framework:** React
- **Language:** TypeScript
- **Build Tool:** Vite
- **Routing:** TanStack Router
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, lucide-react
- **HTTP Client:** Axios
- **Code Quality:** Biome (linting, formatting, checking)
- **Testing:** Vitest

## Project Structure

The project is organized into two main directories: `backend` and `frontend`.

```
/
├── backend/
│   ├── main.py           # FastAPI application entry point
│   ├── database.py       # Database connection and session management
│   ├── models.py         # SQLAlchemy models
│   ├── repositories.py   # Data access layer
│   ├── services.py       # Business logic
│   ├── setup_db.py       # Script to set up the database
│   ├── docker-compose.yml # Docker Compose for PostgreSQL
│   └── ...
└── frontend/
    ├── src/
    │   ├── App.tsx       # Main React component
    │   ├── main.tsx      # Application entry point
    │   ├── components/   # Reusable UI components
    │   ├── routes/       # TanStack Router route components
    │   └── ...
    ├── vite.config.ts    # Vite configuration
    ├── package.json      # Project dependencies and scripts
    └── ...
```

## Getting Started

To run the application, you need to have Docker, Python, and Node.js (or Bun) installed.

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Start the PostgreSQL database:**
    ```bash
    docker-compose up -d
    ```

3.  **Create a virtual environment and install dependencies:**
    ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

4. **Create a `.env` file** in the `backend` directory with the following content:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost/shell_script_manager"
   ```

5.  **Run the database setup script:**
    ```bash
    python setup_db.py
    ```

6.  **Start the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend will be running at `http://localhost:8000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Start the development server:**
    ```bash
    bun run dev
    ```
    The frontend will be running at `http://localhost:3000`.

You can now access the application in your browser at `http://localhost:3000`.
