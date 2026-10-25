FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
COPY redteam ./redteam
RUN pip install --no-cache-dir .
ENTRYPOINT ["python", "-m", "redteam.daemon"]

