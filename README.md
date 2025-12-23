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

## Technical Overview

For those who need the details:

- **Backend**: Python (FastAPI), PostgreSQL, Redis
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Deployment**: Docker, runs on any cloud or on-premise server
- **API**: RESTful, designed for integration with ERPNext and other ERP systems

Full technical documentation is available in the `/docs` directory.

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/certitrack.git

# Start with Docker
cd certitrack
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/api/docs
```

Create your first company account at `/register`, then start adding assets.

---

## License

MIT License. Use it, modify it, deploy it.

---

## Contact

Questions about implementation or customization? Open an issue or reach out directly.

---

*CertiTrack was built because spreadsheets and filing cabinets are not a certification management system. Heavy equipment deserves better. The people working around it deserve better.*
