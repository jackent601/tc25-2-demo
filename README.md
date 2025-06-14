# Desc

# Requirements

- Python, with poetry installed
- npm, with vite installed

# Setup

## Backend

```
cd engine
poetry install
poetry shell
uvicorn main:app --reload
```

check server running on http://127.0.0.1:8000, for example visit http://127.0.0.1:8000/fill and check geojson response

## frontend

```
cd frontend
npm install
npm run dev
```

visit http://localhost:5173/sidebar
