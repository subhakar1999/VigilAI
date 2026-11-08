FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
COPY test_agents ./test_agents
RUN pip install --no-cache-dir .
EXPOSE 9000
CMD ["uvicorn", "test_agents.main:app", "--host", "0.0.0.0", "--port", "9000"]
