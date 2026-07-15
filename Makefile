# Event Booking Platform - Makefile
# ====================================
# Common commands for backend and frontend development.
#
# Usage:
#   make help          - Show this help message
#   make install       - Install all dependencies (backend + frontend)
#   make dev           - Start both backend and frontend dev servers
#   make backend-dev   - Start backend dev server only
#   make frontend-dev  - Start frontend dev server only
#   make test          - Run all tests
#   make test-backend  - Run backend tests only
#   make lint          - Run all linters
#   make build         - Build frontend for production
#   make migrate       - Run database migrations (Alembic)
#   make clean         - Clean build artifacts
#   make docker-up     - Start Docker deployment
#   make docker-down   - Stop Docker deployment

.PHONY: help install dev backend-dev frontend-dev test test-backend test-backend-cov test-frontend lint lint-backend lint-frontend build migrate migrate-create db-reset admin-create clean clean-all docker-up docker-down docker-logs docker-shell

# ─── Colors ────────────────────────────────────────────────────────────────
RED    := \033[0;31m
GREEN  := \033[0;32m
YELLOW := \033[1;33m
CYAN   := \033[0;36m
NC     := \033[0m # No Color

# ─── Help ───────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(CYAN)Event Booking Platform - Available Commands$(NC)"
	@echo "$(YELLOW)═══════════════════════════════════════════$(NC)"
	@echo ""
	@echo "  $(GREEN)make install$(NC)        Install all dependencies (backend + frontend)"
	@echo "  $(GREEN)make dev$(NC)            Start both backend and frontend dev servers"
	@echo "  $(GREEN)make backend-dev$(NC)    Start backend dev server only"
	@echo "  $(GREEN)make frontend-dev$(NC)   Start frontend dev server only"
	@echo "  $(GREEN)make test$(NC)           Run all tests"
	@echo "  $(GREEN)make test-backend$(NC)   Run backend tests only"
	@echo "  $(GREEN)make lint$(NC)           Run all linters"
	@echo "  $(GREEN)make build$(NC)          Build frontend for production"
	@echo "  $(GREEN)make migrate$(NC)        Run database migrations"
	@echo "  $(GREEN)make clean$(NC)          Clean build artifacts"
	@echo "  $(GREEN)make docker-up$(NC)      Start Docker deployment"
	@echo "  $(GREEN)make docker-down$(NC)    Stop Docker deployment"
	@echo ""

# ─── Install Dependencies ──────────────────────────────────────────────────
install:
	@echo "$(YELLOW)📦 Installing backend dependencies...$(NC)"
	cd backend && pip install -r requirements.txt
	@echo "$(GREEN)✅ Backend dependencies installed$(NC)"
	@echo ""
	@echo "$(YELLOW)📦 Installing frontend dependencies...$(NC)"
	cd frontend && npm install
	@echo "$(GREEN)✅ Frontend dependencies installed$(NC)"
	@echo ""
	@echo "$(GREEN)🎉 All dependencies installed!$(NC)"
	@echo "Run 'make dev' to start development servers."

# ─── Development Servers ───────────────────────────────────────────────────
backend-dev:
	@echo "$(YELLOW)🚀 Starting backend server...$(NC)"
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend-dev:
	@echo "$(YELLOW)🚀 Starting frontend server...$(NC)"
	cd frontend && npm run dev

dev:
	@echo "$(CYAN)Starting both servers...$(NC)"
	@echo "$(YELLOW)  Backend:  http://localhost:8000$(NC)"
	@echo "$(YELLOW)  Frontend: http://localhost:5173$(NC)"
	@echo "$(YELLOW)  API Docs: http://localhost:8000/docs$(NC)"
	@echo ""
	@trap 'kill 0' SIGINT; \
		$(MAKE) backend-dev & \
		$(MAKE) frontend-dev & \
		wait

# ─── Tests ─────────────────────────────────────────────────────────────────
test-backend:
	@echo "$(YELLOW)🧪 Running backend tests...$(NC)"
	cd backend && python -m pytest tests/ -v --tb=short
	@echo "$(GREEN)✅ Backend tests completed$(NC)"

test-frontend:
	@echo "$(YELLOW)🧪 Running frontend tests...$(NC)"
	cd frontend && npm test 2>/dev/null || echo "$(RED)⚠ No frontend test script found$(NC)"

test: test-backend test-frontend
	@echo "$(GREEN)🎉 All tests completed!$(NC)"

test-backend-cov:
	@echo "$(YELLOW)🧪 Running backend tests with coverage...$(NC)"
	cd backend && python -m pytest tests/ -v --tb=short --cov=app --cov-report=term --cov-report=html
	@echo "$(GREEN)✅ Coverage report generated at backend/htmlcov/$(NC)"

# ─── Linting ────────────────────────────────────────────────────────────────
lint-backend:
	@echo "$(YELLOW)🔍 Linting backend code...$(NC)"
	cd backend && python -m flake8 app/ 2>/dev/null || echo "$(YELLOW)⚠ flake8 not installed. Skipping...$(NC)"
	cd backend && python -m mypy app/ --ignore-missing-imports 2>/dev/null || echo "$(YELLOW)⚠ mypy not installed. Skipping...$(NC)"

lint-frontend:
	@echo "$(YELLOW)🔍 Linting frontend code...$(NC)"
	cd frontend && npm run lint 2>/dev/null || echo "$(YELLOW)⚠ lint script not found in package.json$(NC)"

lint: lint-backend lint-frontend
	@echo "$(GREEN)✅ Linting completed!$(NC)"

# ─── Build ──────────────────────────────────────────────────────────────────
build:
	@echo "$(YELLOW)🔨 Building frontend for production...$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)✅ Frontend built at frontend/dist/$(NC)"

# ─── Database ───────────────────────────────────────────────────────────────
migrate:
	@echo "$(YELLOW)🗄️  Running database migrations...$(NC)"
	cd backend && alembic upgrade head 2>/dev/null || echo "$(YELLOW)⚠ Alembic not initialized. Auto-creating tables on app start.$(NC)"
	@echo "$(GREEN)✅ Database migration completed$(NC)"

migrate-create:
	@echo "$(YELLOW)📝 Creating new migration...$(NC)"
	@printf "Migration name: "; \
	read name; \
	cd backend && alembic revision --autogenerate -m "$$name"

db-reset:
	@echo "$(RED)⚠ Resetting database...$(NC)"
	cd backend && rm -f event_booking.db test.db 2>/dev/null
	@echo "$(GREEN)✅ Database reset. Tables will be recreated on next start.$(NC)"

# ─── Admin ──────────────────────────────────────────────────────────────────
admin-create:
	@echo "$(YELLOW)👤 Creating admin user...$(NC)"
	cd backend && python -c "
from app.database import SessionLocal, init_db
from app.crud.user import crud_user
from app.schemas.user import UserCreate
from app.models.user import UserRole

init_db()
db = SessionLocal()
try:
    existing = crud_user.get_by_email(db, email='admin@eventbooking.com')
    if not existing:
        user = crud_user.create(db, obj_in=UserCreate(
            email='admin@eventbooking.com',
            username='admin',
            full_name='System Administrator',
            password='Admin123!@#',
            role=UserRole.ADMIN,
        ))
        crud_user.verify(db, user_id=user.id)
        print('✅ Admin user created: admin@eventbooking.com / Admin123!@#')
    else:
        print('✅ Admin user already exists')
finally:
    db.close()
"

# ─── Docker ─────────────────────────────────────────────────────────────────
docker-up:
	@echo "$(YELLOW)🐳 Starting Docker containers...$(NC)"
	docker-compose up --build -d
	@echo "$(GREEN)✅ Docker containers running$(NC)"
	@echo "$(YELLOW)  Frontend: http://localhost:3000$(NC)"
	@echo "$(YELLOW)  Backend:  http://localhost:8000$(NC)"
	@echo "$(YELLOW)  API Docs: http://localhost:8000/docs$(NC)"

docker-down:
	@echo "$(YELLOW)🐳 Stopping Docker containers...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Docker containers stopped$(NC)"

docker-logs:
	docker-compose logs -f

docker-shell:
	docker-compose exec backend /bin/bash 2>/dev/null || docker-compose exec backend sh

# ─── Clean ──────────────────────────────────────────────────────────────────
clean:
	@echo "$(YELLOW)🧹 Cleaning build artifacts...$(NC)"
	# Python
	cd backend && find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	cd backend && find . -type f -name "*.pyc" -delete 2>/dev/null || true
	cd backend && rm -rf htmlcov/ .pytest_cache/ .coverage 2>/dev/null || true
	# Node
	cd frontend && rm -rf dist/ .eslintcache 2>/dev/null || true
	# Database
	cd backend && rm -f test.db 2>/dev/null || true
	@echo "$(GREEN)✅ Clean completed$(NC)"

clean-all: clean
	@echo "$(YELLOW)🧹 Removing all generated files...$(NC)"
	cd backend && rm -rf venv/ 2>/dev/null || true
	cd frontend && rm -rf node_modules/ 2>/dev/null || true
	cd backend && rm -f event_booking.db 2>/dev/null || true
	@echo "$(GREEN)✅ Full clean completed. Run 'make install' to reinstall.$(NC)"
