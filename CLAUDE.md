# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oscar Tracker is a web application for tracking movie viewing and award nominations during the Oscars season. It uses a React/TypeScript frontend with a FastAPI/Python backend and SQLite database.

## Commands

### Frontend Development
```bash
npm run dev          # Start Vite dev server (port 8000, proxies /api to backend)
npm run build        # Build for production (output to dist/)
npm run build:prod   # Build with production mode
npm run lint         # Run ESLint on TS/TSX files
npm run format       # Run Prettier formatting
npm run format:check # Check formatting without changes
```

### Backend Development
```bash
python backend/devserver.py  # Start FastAPI dev server (port 4876)

# For quick import checks or running backend code outside devserver:
ROOT_DIR=$(pwd) poetry run python -c "from backend.module import thing"
```
The backend requires `ROOT_DIR` env var to be set (devserver.py sets this automatically).

### Database Migrations
Alembic is configured for SQLAlchemy migrations. Migration files are in `alembic/versions/`.

### Development Workflow
Run both servers simultaneously:
- Terminal 1: `npm run dev` (frontend on :8000)
- Terminal 2: `python backend/devserver.py` (backend on :4876)

The Vite dev server proxies `/api/*` requests to the backend.

## Architecture

### Backend (backend/)
- **devserver.py**: FastAPI application entry point with uvicorn
- **data/**: Database layer
  - `db_schema.py`: SQLAlchemy ORM models
  - `db_connections.py`: Database initialization and sessions
  - `queries.py`: Read operations
  - `mutations.py`: Write operations
- **routes/**: API endpoint definitions
  - `database_routes.py`: Main CRUD endpoints
  - `forwarding.py`: External API proxying (TMDB, IMDB)
- **logic/**: Business logic and data processing with pandas
- **types/**: Pydantic models (`api_schemas.py`) and validators
- **routing_lib/**: Error handling, session management, request parsing

### Frontend (src/)
- **app/**: Application structure
  - `App.tsx`: Main layout with header, nav drawer, content area
  - `Routing.tsx`: Route definitions
  - `AppProvider.tsx`: Theme, QueryClient, and context setup
  - `routes/`: Page components (HomeTab, UserTab, CategoryTab)
- **features/**: Feature-specific components organized by domain
- **providers/**: Context providers for app state, notifications, routing
- **hooks/**: Custom React hooks (useIsMobile, useActiveUserState, etc.)
- **config/**: Constants, theme config, query client setup

### State Management
- **Server state**: TanStack Query (React Query) for API data
- **App state**: React Context (user session, preferences, year selection)
- **User session**: Cookie-based (`activeUserId` cookie)
- **Preferences**: localStorage

### API Structure
Base URL: `/api`
- `GET/POST/PUT/DELETE /api/users` - User management
- `GET /api/nominations` - Oscar nominations
- `GET /api/movies` - Movie listings
- `GET /api/categories` - Award categories
- `GET/PUT /api/watchlist` - Watch status tracking
- `GET /api/by_user` - User statistics
- `GET /api/by_category` - Category completion stats

### Database
SQLite with SQLAlchemy ORM. WAL journaling enabled for concurrency.
- Primary key formats: `usr_XXXXXX`, `mov_XXXXXX`, `cat_XXXX`
- Main tables: users, movies, nominations, categories, watchnotice

## Tech Stack

**Frontend**: React 18, TypeScript (strict), Vite, Material-UI, TanStack Query, React Router
**Backend**: FastAPI, SQLAlchemy 2.0, Pydantic v2, Pandas, Python 3.12
**Database**: SQLite
**Tools**: ESLint, Prettier (80 char width), Pyright

## Environment

Copy `.env.example` to `.env` and configure:
- `DEVSERVER_PORT`: Backend port (default 4876)
- `VITE_PORT`: Frontend dev port (default 8000)
- `TMDB_API_KEY`: The Movie DB API key
- `DATABASE_PATH`: SQLite database location

## Deployment / CD Process

### Server Architecture
The production server is a VM accessible via SSH. Directory structure:
```
$REMOTE_ROOT/
├── .env                    # Shared environment config (symlinked into releases)
├── current -> releases/... # Symlink to active release (serves traffic)
├── beta -> releases/...    # Symlink to staged release (optional)
├── releases/
│   └── YYYY-MM-DD_HH-MM-SS/  # Timestamped release directories
│       ├── backend/          # Python backend code
│       ├── dist/             # Built frontend assets
│       ├── requirements.txt  # Python dependencies (legacy)
│       ├── .env -> ../../.env
│       └── var -> ../../var
├── var/                    # Persistent data (survives releases)
│   ├── database/db.sqlite  # SQLite database
│   └── logs/               # Application logs
├── venv/                   # Python virtual environment
└── requirements.txt -> current/requirements.txt  # Legacy symlink
```

### Current Upload Process (`upload.to.server.sh`)
Run manually from local machine. Steps:
1. Build frontend (`npm run build:prod`) - prompts with 4s timeout, defaults to rebuild
2. Create timestamped directory on server in `$REMOTE_RELEASES`
3. SCP `dist/`, `backend/`, and `requirements.txt` to new release dir
4. Set file permissions (750 for dirs, 640 for dist files, 750 for backend)
5. Prompt to update symlinks (`--full` flag updates `current`, otherwise updates `beta`)
6. Create symlinks to shared `.env` and `var/` in release dir
7. Restart systemd service (currently gunicorn)

### Configuration
Deployment config stored in `~/deploy.config.sh` (outside repo). Exports:
- `MY_SSH`: SSH connection profile
- `REMOTE_ROOT`: Base deployment directory
- `REMOTE_CURRENT`: Path to `current` symlink
- `REMOTE_BETA`: Path to `beta` symlink
- `REMOTE_RELEASES`: Path to `releases/` directory
- `MY_USER`: Server user account
- `DAEMON_GROUP`: Group for service permissions
- `SERVICE_NAME`: Systemd service name

### Migration Status (In Progress)
**Dependencies:**
- LOCAL: Migrating from `requirements.txt` to Poetry (`pyproject.toml`)
- SERVER: Still uses `requirements.txt` and root-level venv
- `pyproject.toml` now includes FastAPI, uvicorn, alembic; `requirements.txt` still has Flask deps

**Server Framework:**
- LOCAL: Now FastAPI + uvicorn (ASGI) in `backend/devserver.py`
- SERVER: Still runs gunicorn (WSGI) - systemd service references gunicorn
- Upload script still says "Restarting gunicorn..."

**Database Migrations:**
- Alembic configured with `alembic/` directory
- Initial migration exists: `alembic/versions/b085abab72bc_initial_migration.py`
- DB path: `sqlite:///./var/database/db.sqlite` (relative to project root)
- Server has existing database that predates migrations - initial migration may need special handling

### Planned Modernization Steps
These may be tackled across multiple sessions:
1. **GitHub Actions**: Move from manual `upload.to.server.sh` to automated CI/CD
2. **Poetry on Server**: Replace venv + requirements.txt with poetry-managed deps
3. **Uvicorn on Server**: Update systemd service from gunicorn to uvicorn
4. **Alembic Integration**: Run initial migration on server, integrate migrations into deploy
5. **Remove Flask Deps**: Clean up requirements.txt references once fully on FastAPI

### Notes for Future Sessions
- The upload script uses WSL (`cmd.exe /c npm run build:prod`) - adjust for GitHub Actions
- Requirements installation step (step 4) is commented out in current script
- `REMOTE_BETA` allows staged deployments before going live to `REMOTE_CURRENT`
- Each release is self-contained except for shared `.env` and `var/` symlinks
- Server state will change incrementally - check actual server state when debugging
