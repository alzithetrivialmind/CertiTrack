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

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis (for scheduled tasks)

### Backend Setup

```bash
# Navigate to backend
cd CertiTrack/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp config.example.env .env
# Edit .env with your settings

# Create database
createdb certitrack

# Run migrations (if using Alembic)
alembic upgrade head

# Start server
python run.py
# or
uvicorn app.main:app --reload
```

API will be available at: http://localhost:8000

API Documentation: http://localhost:8000/api/docs

### Frontend Setup

```bash
# Navigate to frontend
cd CertiTrack/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

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

