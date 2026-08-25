FROM python:3.11-slim

WORKDIR /backend

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

COPY . .

# Set PYTHONPATH to parent directory so that imports starting with "backend.app" resolve
ENV PYTHONPATH=/

CMD exec uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
