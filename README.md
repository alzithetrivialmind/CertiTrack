# CertiTrack

**Digital Testing & Certification Platform for Heavy Equipment**

---

## The Problem

In Indonesian shipyards (galangan kapal), heavy lifting equipment like cranes, shackles, and wire ropes must be tested and certified regularly. This is not optional—it's a legal requirement under Permenaker No. 8/2020 and international maritime standards.

Yet the reality on the ground is far from compliant.

### What Actually Happens

**1. Paper Chaos**

Certificates live in filing cabinets. Test records are scattered across Excel files, WhatsApp groups, and handwritten logbooks. When an auditor asks for documentation, staff spend hours—sometimes days—digging through archives.

One shipyard manager told us: *"We have 200+ assets. Finding one certificate can take half a day."*

**2. Expired Certificates Go Unnoticed**

There is no system to track expiry dates. Equipment continues to operate with expired certifications until someone manually checks, or worse, until an accident happens.

A crane with an expired certificate is a liability waiting to become a headline.

**3. Human Error in Test Validation**

Inspectors record test results manually. A load test requires comparing the applied load against the Safe Working Load (SWL), calculating percentages, and determining pass/fail. This is done by hand, often under time pressure.

Mistakes happen. A shackle rated for 10 tons gets approved after a 15-ton test load that should have flagged it. The paperwork says "PASS" because someone misread the numbers.

**4. Certificate Fraud is Too Easy**

Paper certificates can be photocopied, altered, or fabricated entirely. There is no way for clients, auditors, or port authorities to verify authenticity without calling the issuing company directly.

**5. No Visibility Across Operations**

Management has no dashboard. No real-time view of how many assets are compliant, how many are due for testing, or which equipment poses risk. Decisions are made on gut feeling, not data.

---

## The Cost

| Risk | Consequence |
|------|-------------|
| Workplace accident from equipment failure | Fatalities, permanent injuries |
| Failed audit | Operations suspended, contracts lost |
| Regulatory penalties | Fines, license revocation |
| Insurance claim denied | Equipment not properly certified |
| Reputation damage | Loss of future contracts |

These are not hypothetical. They happen every year in shipyards across Indonesia.

---

## The Solution

CertiTrack replaces paper-based certification management with a digital system designed specifically for heavy equipment testing.

### Core Workflow

```
Register Asset → Conduct Test → System Validates → Generate Certificate
```

That's it. No spreadsheets. No manual calculations. No paper to lose.

### How It Works

**Asset Registry**

Every piece of equipment gets a digital record: serial number, manufacturer, Safe Working Load, location, and a unique QR code. Scan the QR with any phone to instantly access the asset's complete history.

**Automated Test Validation**

When an inspector submits test results, the system automatically validates pass/fail based on defined criteria:

- Load test: Did applied load exceed 110% of SWL without permanent deformation?
- Visual inspection: Are all checklist items marked as acceptable?
- Measurement: Are deflection values within tolerance?

No mental math. No subjective judgment on borderline cases. The system applies the rules consistently, every time.

**Digital Certificates**

One click generates a professional PDF certificate with:

- Unique certificate number
- QR code linking to verification page
- Digital signature
- Complete test data

Anyone can scan the QR code to verify the certificate is authentic and current. Fraud becomes impossible.

**Expiry Tracking**

The system knows when every certificate expires. At 30 days, 14 days, and 7 days before expiry, it sends alerts. No asset slips through the cracks.

**Management Dashboard**

Real-time visibility:

- Total assets by category and status
- Certificates expiring this month
- Test pass/fail rates
- Compliance percentage across the fleet

Make decisions based on data, not assumptions.

---

## Who This Is For

**Shipyards (Galangan Kapal)**

You operate dozens or hundreds of cranes, hoists, and lifting accessories. Compliance is mandatory for port operations. CertiTrack keeps you audit-ready at all times.

**Third-Party Inspection Companies (Vendor Inspeksi)**

You conduct tests for multiple clients across multiple sites. CertiTrack organizes your work, standardizes your output, and gives clients confidence in your professionalism.

**Heavy Logistics & Offshore Contractors**

Your equipment moves between sites and vessels. Tracking certification status across a mobile fleet is impossible on paper. CertiTrack makes it simple.

---

## What Changes

| Before CertiTrack | After CertiTrack |
|-------------------|------------------|
| Certificates in filing cabinets | Searchable digital archive |
| Expiry dates tracked in Excel (maybe) | Automated alerts 30/14/7 days ahead |
| Manual pass/fail calculation | Instant automated validation |
| Paper certificates easily forged | QR-verified digital certificates |
| No visibility for management | Real-time compliance dashboard |
| Hours to prepare for audit | Audit-ready in minutes |

---

## Features

| Category | Features |
|----------|----------|
| **Asset Management** | Asset registry, QR code generation, photo attachments, location tracking |
| **Test Management** | Test submission, automated validation, pass/fail determination, test history |
| **Certificates** | PDF generation, digital signature, QR verification, expiry tracking |
| **Dashboard** | Summary stats, category breakdown, expiring assets, recent activity |
| **Alerts** | Email notifications for expiring certificates (30/14/7 days) |
| **Authentication** | JWT-based auth, role-based access (Admin, Inspector, Viewer) |
| **Multi-tenant** | Company isolation, each organization sees only their data |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, React Query |
| **Backend** | FastAPI (Python 3.11+), Pydantic, SQLAlchemy |
| **Database** | PostgreSQL (production), SQLite (development) |
| **Authentication** | JWT with OAuth2, bcrypt password hashing |
| **PDF Generation** | ReportLab, WeasyPrint |
| **QR Code** | python-qrcode |
| **Task Queue** | Celery + Redis |
| **Containerization** | Docker, Docker Compose |

---

## Architecture

```
CertiTrack/
├── backend/                 # FastAPI Python Backend
│   ├── app/
│   │   ├── api/            # API Routes (assets, tests, certificates, users)
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── schemas/        # Pydantic Schemas
│   │   ├── services/       # Business Logic (PDF, QR, validation)
│   │   └── config.py       # Configuration
│   ├── static/             # Generated files (QR codes, PDFs)
│   └── requirements.txt
│
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App Router (pages)
│   │   ├── components/    # UI Components
│   │   └── lib/           # API client, utilities, store
│   └── package.json
│
├── docker-compose.yml      # Full stack orchestration
└── README.md
```

---

## Getting Started

### Option 1: Docker (Recommended)

The fastest way to run CertiTrack with all dependencies.

```bash
# Clone repository
git clone https://github.com/your-org/certitrack.git
cd certitrack

# Start all services
docker-compose up -d --build

# Check status
docker-compose ps
```

Access:
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs

### Option 2: Local Development (SQLite)

For development without Docker.

**Backend:**

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt
pip install aiosqlite

# Start server
python run.py
```

**Frontend:**

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 3: Local Development (PostgreSQL)

For production-like environment.

```bash
# Set database URL
$env:DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/certitrack"

# Then follow backend/frontend setup above
```

---

## First Login

1. Open http://localhost:3000/register
2. Create company account with admin credentials
3. Login at http://localhost:3000/login

Or via API:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register-company?admin_email=admin@test.com&admin_password=password123&admin_name=Admin" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Company", "slug": "my-company", "email": "company@test.com"}'
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/register-company` | Register company + admin |
| POST | `/api/v1/auth/refresh` | Refresh access token |

### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/assets` | List assets (paginated, filterable) |
| POST | `/api/v1/assets` | Create asset |
| GET | `/api/v1/assets/{id}` | Get asset details |
| PUT | `/api/v1/assets/{id}` | Update asset |
| DELETE | `/api/v1/assets/{id}` | Soft delete asset |
| GET | `/api/v1/assets/scan/{qr_data}` | Get asset by QR code |

### Tests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tests` | List tests |
| POST | `/api/v1/tests` | Create test |
| POST | `/api/v1/tests/submit` | Submit test with auto-validation |
| POST | `/api/v1/tests/{id}/validate` | Re-validate existing test |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/certificates` | List certificates |
| POST | `/api/v1/certificates/generate` | Generate certificate |
| GET | `/api/v1/certificates/{id}` | Get certificate details |
| GET | `/api/v1/certificates/{id}/download` | Download PDF |
| GET | `/api/v1/certificates/verify/{number}` | Public verification |
| POST | `/api/v1/certificates/{id}/revoke` | Revoke certificate |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/summary` | Dashboard statistics |
| GET | `/api/v1/dashboard/expiring-assets` | Assets with expiring certificates |
| GET | `/api/v1/dashboard/test-trends` | Test analytics |

---

## Security

- JWT-based authentication with access and refresh tokens
- Role-based access control: Super Admin, Company Admin, Inspector, Viewer
- Multi-tenant data isolation by company_id
- Password hashing with bcrypt
- CORS configured for frontend origin
- Digital signature on generated certificates

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | SQLite (dev) |
| `SECRET_KEY` | JWT signing key | change-me-in-production |
| `REDIS_URL` | Redis connection for Celery | redis://localhost:6379 |
| `CORS_ORIGINS` | Allowed frontend origins | http://localhost:3000 |

---

## License

MIT License. Free for commercial use.

---

## Contributing

Contributions welcome. Please open an issue first to discuss proposed changes.

---

*CertiTrack was built because spreadsheets and filing cabinets are not a certification management system. Heavy equipment deserves better. The people working around it deserve better.*
