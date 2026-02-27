# ExpenseIQ / Student Expense Analyzer - macOS Setup

This guide is for a teammate on Mac who cloned the repo and needs a full fresh setup.

## 1) VS Code Extensions

Install these extensions:

- `dbaeumer.vscode-eslint` (ESLint)
- `esbenp.prettier-vscode` (Prettier)
- `bradlc.vscode-tailwindcss` (Tailwind CSS IntelliSense)
- `Prisma.prisma` (Prisma)
- `ms-python.python` (Python)
- `ms-python.vscode-pylance` (Pylance)
- `mikestead.dotenv` (dotenv files)

Optional command-line install:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension Prisma.prisma
code --install-extension ms-python.python
code --install-extension ms-python.vscode-pylance
code --install-extension mikestead.dotenv
```

## 2) System Prerequisites (macOS)

```bash
# If Homebrew is not installed:
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node@20 python@3.11 postgresql@16
brew services start postgresql@16

node -v
npm -v
python3 --version
psql --version
```

## 3) Clone and Enter Project

```bash
git clone <your-repo-url>
cd student-expense-analyzer
```

## 4) Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_expense_analyzer"
JWT_SECRET="change_this_jwt_secret"
JWT_EXPIRES_IN="7d"
REFRESH_SECRET="change_this_refresh_secret"
REFRESH_EXPIRES_IN="30d"
CORS_ORIGIN="http://localhost:5173"
ML_SERVICE_URL="http://localhost:8001"
```

Create DB + run Prisma:

```bash
createdb student_expense_analyzer || true
npx prisma generate
npx prisma migrate dev
```

## 5) Frontend Setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

## 6) ML Setup

```bash
cd ../ml
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run ML service:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## 7) Run Full Project (3 terminals)

Terminal A - ML:

```bash
cd student-expense-analyzer/ml
source .venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Terminal B - Backend:

```bash
cd student-expense-analyzer/backend
npm run dev
```

Terminal C - Frontend:

```bash
cd student-expense-analyzer/frontend
npm run dev
```

## 8) URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- ML Swagger: `http://localhost:8001/docs`
- ML Health: `http://localhost:8001/health`

## 9) Quick Troubleshooting

- `ERR_CONNECTION_REFUSED` on frontend:
  - Check backend is running on `:5000`.
- ML calls failing:
  - Check ML service is running on `:8001`.
  - Verify `ML_SERVICE_URL` in `backend/.env`.
- Prisma errors:
  - Confirm Postgres service is running.
  - Confirm `DATABASE_URL` is valid.
