FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 COMMERCE_DB_PATH=/data/commerce.db
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py zoom.py ./

RUN useradd --uid 10001 --create-home app && mkdir -p /data && chown 10001 /data
USER 10001

EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
