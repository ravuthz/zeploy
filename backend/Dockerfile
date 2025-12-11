# Stage 1 — Build
FROM python:3.11-slim as build

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first for caching
COPY requirements.txt .

# Install Python dependencies
# RUN pip install --no-cache-dir -r requirements.txt
RUN pip install -r requirements.txt

# Stage 2 — Production
FROM python:3.11-slim

WORKDIR /app

# Copy installed dependencies from build stage
COPY --from=build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=build /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Set environment variable for production
ENV PYTHONUNBUFFERED=1
ENV ENV=production

CMD ["uvicorn", "main:app", "--reload", "--port", "8000"]

# Start Uvicorn via Gunicorn for production
# CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "webhook:app", "-b", "0.0.0.0:8001", "--timeout", "120"]