FROM python:3.13.5-slim-bookworm

# Set environment
ENV POETRY_VERSION=1.8.3 \
    PYTHONUNBUFFERED=1 \
    POETRY_VIRTUALENVS_CREATE=false

# Install Poetry
RUN pip install "poetry==$POETRY_VERSION"

# Copy and install dependencies
WORKDIR /app
COPY ./pyproject.toml ./
COPY ./poetry.lock* ./
RUN poetry install --no-root

# Copy source code
COPY ./ .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]