# CertiTrack - Digital Testing & Certification Platform

![CertiTrack](https://img.shields.io/badge/CertiTrack-v1.0.0-ff6b35)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/License-MIT-green)

**CertiTrack** is a SaaS platform for managing heavy equipment testing, certification, and compliance tracking. Designed for shipyards, inspection vendors, and heavy logistics companies.

## 🎯 Key Features

### ✅ Asset Registry
Complete database for tracking all types of heavy equipment:
- Cranes (Overhead, Mobile, Tower, Gantry)
- Load Cells & Weighing Scales
- Shackles, Wire Rope, Chain Slings
- Forklifts & Transport Equipment

### 🔔 Automatic Alerts
- Email/WhatsApp notifications 30 days before certificate expiry
- Dashboard alerts for critical and warning status
- Never miss an audit deadline again

### 📱 QR Code Tracking
- Generate unique QR codes for each asset
- Field workers scan to access records instantly
- Input test data directly from mobile device

### 🤖 Auto Validation
- System automatically validates pass/fail based on test data
- Eliminates human error in result calculation
- Validates load test, deflection, and deformation parameters

### 📄 One-Click Certificates
- Professional PDF certificates generated instantly
- Digitally signed with verification capability
- Public verification endpoint for authenticity

### 🔗 ERPNext Ready
- Built with Python FastAPI for native integration
- REST API compatible with ERPNext
- Easy data sync with existing ERP systems

## 🏗️ Architecture

```
CertiTrack/
├── backend/                 # FastAPI Python Backend
│   ├── app/
│   │   ├── api/            # API Routes
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── schemas/        # Pydantic Schemas
│   │   └── services/       # Business Logic
│   ├── static/             # Generated files (QR, PDFs)
│   └── requirements.txt
│
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router Pages
│   │   ├── components/    # React Components
│   │   └── lib/           # Utilities & API Client
│   └── package.json
│
└── README.md
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | FastAPI, Python 3.11+ |
| **Database** | PostgreSQL |
| **ORM** | SQLAlchemy (async) |
| **Auth** | JWT (OAuth2) |
| **PDF** | ReportLab |
| **QR Code** | python-qrcode |
| **Queue** | Celery + Redis |
| **Charts** | Recharts |

## 🚀 Getting Started

Choose one of the following setup methods:

---

### 🐳 Option 1: Docker (Recommended)

The easiest way to run CertiTrack with all services (PostgreSQL, Redis, Backend, Frontend).

**Prerequisites:**
- Docker Desktop installed and running

**Steps:**

```bash
# Navigate to project root
cd CertiTrack

# Build and start all services
docker-compose up -d --build

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f
```

**Access:**
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/api/docs

**Manage:**
```bash
# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart frontend

# Rebuild after code changes
docker-compose up -d --build
```

---

### 💻 Option 2: Local Development with SQLite

Run locally without Docker, using SQLite for simplicity.

**Prerequisites:**
- Python 3.11+ (Note: Python 3.12 recommended, 3.14 may have compatibility issues)
- Node.js 18+

**Backend Setup:**

```bash
# Navigate to backend
cd CertiTrack/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install SQLite async driver
pip install aiosqlite

# Start server (uses SQLite by default)
python run.py
```

The backend will automatically:
- Create a `certitrack.db` SQLite database file
- Initialize all tables on startup

**Frontend Setup:**

```bash
# Navigate to frontend
cd CertiTrack/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access:**
- 🌐 **Frontend**: http://localhost:3000
- 🔌 **API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/api/docs

---

### 🐘 Option 3: Local Development with PostgreSQL

For production-like environment.

**Prerequisites:**
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ installed and running
- Redis (optional, for scheduled tasks)

**Backend Setup:**

```bash
# Navigate to backend
cd CertiTrack/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create database
createdb certitrack

# Set environment variable for PostgreSQL
# On Windows PowerShell:
$env:DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/certitrack"
# On macOS/Linux:
export DATABASE_URL="postgresql+asyncpg://postgres:password@localhost:5432/certitrack"

# Start server
python run.py
```

**Frontend Setup:**

```bash
# Navigate to frontend
cd CertiTrack/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

### 🔑 First Login

After setup, you need to create an account:

1. Open http://localhost:3000/register
2. Fill in company details and create admin account
3. Login at http://localhost:3000/login

Or use API directly:
```bash
# Register company via API
curl -X POST "http://localhost:8000/api/v1/auth/register-company?admin_email=admin@test.com&admin_password=password123&admin_name=Admin" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company", "slug": "my-company", "email": "company@test.com"}'
```

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/register-company` - Register company + admin

### Assets
- `GET /api/v1/assets` - List assets (paginated, filterable)
- `POST /api/v1/assets` - Create asset
- `GET /api/v1/assets/{id}` - Get asset details
- `PUT /api/v1/assets/{id}` - Update asset
- `DELETE /api/v1/assets/{id}` - Soft delete asset
- `GET /api/v1/assets/scan/{qr_data}` - Get asset by QR

### Tests
- `GET /api/v1/tests` - List tests
- `POST /api/v1/tests` - Create test
- `POST /api/v1/tests/submit` - Submit test results (auto-validates)
- `POST /api/v1/tests/{id}/validate` - Re-validate test

### Certificates
- `GET /api/v1/certificates` - List certificates
- `POST /api/v1/certificates/generate` - Generate certificate
- `GET /api/v1/certificates/{id}/download` - Download PDF
- `GET /api/v1/certificates/verify/{number}` - Public verification

### Dashboard
- `GET /api/v1/dashboard/summary` - Dashboard stats
- `GET /api/v1/dashboard/expiring-assets` - Expiring certificates
- `GET /api/v1/dashboard/test-trends` - Test analytics

## 🔒 Security

- JWT-based authentication with refresh tokens
- Role-based access control (Super Admin, Company Admin, Inspector, Viewer)
- Multi-tenant data isolation by company
- Password hashing with bcrypt
- Digital signature on certificates

## 📊 Workflow

```
┌──────────────────────────────────────────────────────────────┐
│                        CertiTrack Workflow                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐ │
│   │ 1. SCAN │ -> │ 2. TEST │ -> │ 3.VALIDATE│ -> │ 4. CERT │ │
│   │ QR Code │    │ Input   │    │ Auto     │    │ Generate│ │
│   └─────────┘    └─────────┘    └──────────┘    └─────────┘ │
│       │              │              │               │        │
│       v              v              v               v        │
│   Asset Info    Test Data      PASS/FAIL      PDF Ready     │
│   Retrieved     Recorded       Instantly      Download      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## 🔄 ERPNext Integration

CertiTrack is designed for seamless integration with ERPNext:

1. **API Compatibility**: RESTful JSON API matches ERPNext patterns
2. **Data Sync**: Assets, Tests, and Certificates can sync via webhooks
3. **Authentication**: API key support for server-to-server auth
4. **Python Native**: Same technology stack as ERPNext/Frappe

Example integration:
```python
from frappe_client import FrappeClient

# Push asset to ERPNext
client = FrappeClient("https://erp.company.com", "api_key", "api_secret")
client.insert({
    "doctype": "Asset",
    "asset_name": asset.name,
    "asset_category": asset.category,
    "custom_certitrack_id": str(asset.id),
})
```

## 🎨 UI/UX

The frontend features a modern, minimalist design inspired by Gumroad:
- Clean typography and generous whitespace
- Vibrant coral/orange accent color (#ff6b35)
- Smooth animations and transitions
- Mobile-responsive design
- Dark sidebar navigation

## 📝 License

MIT License - feel free to use for commercial projects.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📞 Support

For questions or support, please open an issue on GitHub.

---

**CertiTrack** - From hours to seconds. Eliminate human error. Stay compliant.

