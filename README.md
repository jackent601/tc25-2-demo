# Desc

# Requirements

- docker

or if deving/running manually

- Python, with poetry installed
- npm, with vite installed
- Recommended: VSCode

# Docker

## Setup

First build the images, in the top level project directory...

if running in linux or wsl can simply run

```
./buildImages.sh
```

or can build individually (see buildEngineImage.sh, and buildFrontendImage.sh) run

```
docker build -t tc25-2-engine -f ./engine/Dockerfile ./engine
docker build -t tc25-2-frontend -f ./frontend/Dockerfile ./frontend
```

## Run

### docker compose

if using docker compose simply run

```
docker compose up
```

check engine server running and exposed on http://127.0.0.1:8000, for example visit http://127.0.0.1:8000/coloured-polygons and check geojson response

check frontend is running and reachable at http://localhost:5173/

### individual docker 

you can run the docker images individually if not using docker compose with the following

```
docker run -d -p 8000:8000 --name engine-container engine
docker run -d -p 5173:5173 --name frontend-container frontend
```

# Manual

to run on machine directly (useful for fast development)...

Recommend: open vs code at this top level with (VSCode must be installed)

```
code .
```

## Backend

```
cd engine
poetry install
poetry shell
uvicorn main:app --reload
```

check engine server running on http://127.0.0.1:8000, for example visit http://127.0.0.1:8000/coloured-polygons and check geojson response

## frontend

```
cd frontend
npm install
npm run dev
```

visit http://localhost:5173/
