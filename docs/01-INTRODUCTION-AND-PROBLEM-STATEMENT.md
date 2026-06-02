# CHAPTER 1: INTRODUCTION

## 1.1 Introduction

In the modern digital era, identity verification and document authentication have become critical components of financial services, government operations, and enterprise compliance workflows. The rapid digitization of services has led to an exponential increase in document submissions — ranging from bank statements and salary slips to government-issued identity proofs such as Aadhaar, PAN cards, and passports. While this shift has improved accessibility and speed, it has simultaneously opened the door to sophisticated document fraud, identity theft, and forgery.

Block ID Guard is a full-stack, intelligent document verification and fraud detection system designed to address these challenges head-on. It is built using a modern technology stack — **Next.js 16 with React 19** on the frontend and **Node.js with Express 5, TypeScript, and PostgreSQL** on the backend — and integrates a multi-layered AI pipeline for document intelligence, risk scoring, behavioral analytics, and blockchain-inspired audit logging.

The system is designed around four core user roles:

- **Customer** — Registers, uploads documents (PDF/JPG/PNG), and views their document status and AI-generated risk analysis.
- **Sanction Manager** — Reviews documents in a dedicated queue, views AI verdicts and risk scores, and makes approve/reject/flag decisions.
- **Admin** — Has full system visibility including user management, audit logs, sanction manager creation, and system-wide document oversight.
- **Lead** — A supervisory role for escalated review scenarios.

When a customer uploads a document, the system immediately triggers a multi-stage processing pipeline:

1. **Text Extraction** — PDF text is extracted using `pdf-parse`; image documents are processed through Tesseract.js OCR.
2. **Image Signal Extraction** — The Sharp library analyzes image metadata for resolution, DPI, format anomalies, and progressive encoding.
3. **Document Intelligence** — Three classifiers run in parallel: document type classification (BANK_STATEMENT, SALARY_SLIP, ID_PROOF, UNKNOWN), validity classification (dummy/placeholder detection), and forgery signal detection.
4. **Risk Scoring** — A weighted rule engine calculates a risk score (0–100) based on document signals and behavioral patterns.
5. **Policy Engine** — Maps risk scores to decisions: AUTO-APPROVE (LOW), MANUAL REVIEW (MEDIUM), REJECT (HIGH/CRITICAL).
6. **AI Advisory** — Generates a human-readable explanation of the risk verdict.
7. **Audit Logging** — Every action is SHA-256 hashed and stored in an immutable audit ledger.

Block ID Guard is entirely self-hosted, requiring no third-party verification APIs, making it cost-effective, privacy-preserving, and fully customizable for institutional deployment.

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    BLOCK ID GUARD — SYSTEM OVERVIEW                     ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║   CUSTOMER          SANCTION MANAGER          ADMIN                     ║
║      │                     │                    │                        ║
║      ▼                     ▼                    ▼                        ║
║  ┌─────────────────────────────────────────────────┐                    ║
║  │           NEXT.JS 16 FRONTEND (React 19)        │                    ║
║  │  /login  /dashboard  /upload  /sanctions  /admin│                    ║
║  └──────────────────────┬──────────────────────────┘                    ║
║                         │  REST API (HTTP + JWT Cookie)                  ║
║                         ▼                                                ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │                  EXPRESS.JS 5 BACKEND (TypeScript)               │   ║
║  │                                                                  │   ║
║  │  ┌─────────────────────┐    ┌──────────────────────────────┐    │   ║
║  │  │     AI LAYER        │    │       SECURITY LAYER         │    │   ║
║  │  │                     │    │                              │    │   ║
║  │  │  • Text Extractor   │    │  • Risk Engine (0–100)       │    │   ║
║  │  │  • Image Extractor  │    │  • Policy Engine             │    │   ║
║  │  │  • Type Classifier  │    │  • Behavior Tracker          │    │   ║
║  │  │  • Type Verifier    │    │  • Anomaly Detector          │    │   ║
║  │  │  • Validity Check   │    │  • Defense Engine            │    │   ║
║  │  │  • Forgery Detect   │    │  • SHA-256 Audit Ledger      │    │   ║
║  │  │  • AI Advisory      │    │                              │    │   ║
║  │  └─────────────────────┘    └──────────────────────────────┘    │   ║
║  └──────────────────────────────────┬───────────────────────────────┘   ║
║                                     │                                    ║
║                                     ▼                                    ║
║              ┌──────────────────────────────────────┐                   ║
║              │   POSTGRESQL + PRISMA ORM            │                   ║
║              │  User · Document · AIExtraction      │                   ║
║              │  RiskSnapshot · AuditLog · Behavior  │                   ║
║              └──────────────────────────────────────┘                   ║
╚══════════════════════════════════════════════════════════════════════════╝
```
*Figure 1.1 — Block ID Guard System Overview*

### 1.1.1 Background and Motivation

The Indian digital economy has witnessed unprecedented growth in online financial services. According to RBI data, digital payment transactions crossed 100 billion in FY 2022–23 [21]. With this growth, the volume of digital document submissions for KYC (Know Your Customer), loan applications, account opening, and government benefit enrollment has surged proportionally.

Traditional document verification relied on physical document inspection by trained personnel. The shift to digital-first processes has created a verification gap — organizations need to verify documents at scale, at speed, and with accuracy, without the luxury of physical inspection. This gap is exploited by fraudsters who submit forged, edited, or meaningless documents to gain unauthorized access to financial services.

Block ID Guard was conceived to fill this gap by providing an intelligent, automated, and explainable document verification system that any organization can deploy on their own infrastructure.

### 1.1.2 Scope of the System

Block ID Guard is scoped to handle the following document verification use cases:

- **Financial Document Verification** — Bank statements, salary slips, income tax returns
- **Identity Document Verification** — Aadhaar cards, PAN cards, passports, driving licenses
- **General Document Submission** — Any PDF or image document requiring authenticity verification

The system is designed for deployment in:
- Banking and Non-Banking Financial Companies (NBFCs) for loan processing
- Insurance companies for claim document verification
- Government portals for benefit enrollment document verification
- HR departments for employee onboarding document verification
- Educational institutions for certificate and transcript verification

### 1.1.3 Key Innovations

Block ID Guard introduces the following innovations over existing solutions:

**Innovation 1 — Semantic Dummy Detection**
Beyond simple file format validation, Block ID Guard analyzes the semantic content of documents. A document with valid format but meaningless content (Lorem Ipsum, random words, insufficient numeric data) is detected and rejected. This addresses a fraud pattern that most commercial solutions miss entirely.

**Innovation 2 — Content-Quality Correlation for Forgery Detection**
The system correlates document content sensitivity with image quality. A high-value financial document (containing salary, bank, or identity keywords) submitted as a low-resolution image is flagged as a potential forgery. Real financial documents from banks and government agencies are always high-resolution.

**Innovation 3 — Three-Level Ensemble Decision Making**
The final verdict is produced by three independent layers: the Risk Engine (weighted signals), the Policy Engine (threshold rules), and the AI Advisory (contextual reasoning). This ensemble approach prevents single-point failures and produces more reliable verdicts than any single-layer system.

**Innovation 4 — Zero External Dependency**
The entire AI pipeline runs locally — Tesseract.js for OCR, Sharp for image analysis, pdf-parse for PDF extraction. No document data ever leaves the server. This is a fundamental privacy and compliance advantage over cloud-based verification APIs.

---

## 1.2 Problem Statement

The proliferation of digital document submission systems has created a significant vulnerability in identity verification workflows. Organizations across banking, insurance, lending, and government sectors face the following critical challenges:

**1. Rampant Document Forgery**
Digital editing tools such as Adobe Photoshop, GIMP, and online PDF editors have made it trivially easy to alter document content — changing salary figures, account balances, or identity details. Traditional verification systems that rely solely on visual inspection or basic metadata checks are insufficient to detect such manipulations.

**2. Dummy and Placeholder Document Submissions**
A significant percentage of fraudulent submissions involve documents with minimal or meaningless content — blank PDFs, Lorem Ipsum text, or documents with fewer than 20 words. Existing systems often lack semantic validation capabilities to detect such submissions.

**3. Absence of Behavioral Context**
Most document verification systems evaluate documents in isolation, ignoring the behavioral context of the submitter. Rapid successive uploads, multiple failed verification attempts, and unusual upload patterns are strong fraud indicators that are routinely overlooked.

**4. Lack of Explainability in AI Decisions**
Commercial verification platforms (Onfido, Jumio, Trulioo) operate as black-box systems [23] — they return a pass/fail verdict without explaining the reasoning. This creates compliance challenges and makes it impossible for human reviewers to understand or contest decisions.

**5. High Cost and External Dependency**
Commercial solutions charge $1–$5 per verification [23], which is prohibitive for high-volume use cases. They also require sending sensitive documents to third-party servers, raising serious data privacy and regulatory compliance concerns.

**6. Inadequate Audit Trails**
Traditional logging systems store plain-text logs that can be modified or deleted. There is no cryptographic guarantee of log integrity, making forensic investigations unreliable.

**7. No Unified Role-Based Workflow**
Existing solutions lack a structured multi-role workflow where AI-flagged documents are routed to human reviewers (sanction managers) with full context, risk scores, and AI advisory notes.

Block ID Guard directly addresses all seven of these problems through its integrated, multi-layer architecture.

```
┌─────────────────────────────────────────────────────────────────────┐
│              DOCUMENT FRAUD PROBLEM CONTEXT                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   FRAUD VECTORS                    IMPACT SECTORS                  │
│   ─────────────                    ──────────────                  │
│   ┌──────────────────┐             ┌─────────────────┐             │
│   │ Forged PDFs      │────────────▶│ Banking / NBFCs │             │
│   │ (Photoshop/GIMP) │             │ Loan fraud      │             │
│   └──────────────────┘             └─────────────────┘             │
│   ┌──────────────────┐             ┌─────────────────┐             │
│   │ Dummy Documents  │────────────▶│ Insurance       │             │
│   │ (Lorem Ipsum)    │             │ Claim inflation │             │
│   └──────────────────┘             └─────────────────┘             │
│   ┌──────────────────┐             ┌─────────────────┐             │
│   │ Wrong Doc Type   │────────────▶│ Government KYC  │             │
│   │ (PAN as Aadhaar) │             │ Benefit fraud   │             │
│   └──────────────────┘             └─────────────────┘             │
│   ┌──────────────────┐             ┌─────────────────┐             │
│   │ Low-Quality Scan │────────────▶│ HR / Employment │             │
│   │ (Blurry forgery) │             │ Fake credentials│             │
│   └──────────────────┘             └─────────────────┘             │
│                                                                     │
│   EXISTING SYSTEM GAPS              BLOCK ID GUARD SOLUTION        │
│   ────────────────────              ────────────────────────       │
│   ✗ No semantic validation [23] ───▶  ✓ Dummy + semantic detection   │
│   ✗ No type mismatch check      ───▶  ✓ Strict format rule engine    │
│   ✗ Black-box AI decisions [23] ───▶  ✓ Explainable AI advisory      │
│   ✗ No behavioral context       ───▶  ✓ Upload pattern tracking      │
│   ✗ No audit integrity          ───▶  ✓ SHA-256 immutable ledger     │
│   ✗ $1–$5 per verification [23]───▶  ✓ Zero per-verification cost   │
└─────────────────────────────────────────────────────────────────────┘
```
*Figure 1.2 — Document Fraud Problem Context Diagram*

### 1.2.1 Real-World Impact of Document Fraud

Document fraud has severe real-world consequences across multiple sectors:

**Banking Sector:** Fraudulent salary slips and bank statements are used to obtain personal loans and credit cards. The RBI reported that bank fraud cases involving document forgery amounted to thousands of crores in losses annually [21].

**Insurance Sector:** Forged medical documents and income proofs are used to inflate insurance claims. The Insurance Regulatory and Development Authority of India (IRDAI) estimates that fraudulent claims account for 8–10% of total claims paid [22].

**Government Benefits:** Fake income certificates and identity documents are used to fraudulently claim government subsidies, scholarships, and welfare benefits.

**Employment:** Forged educational certificates and experience letters are submitted during hiring processes, leading to unqualified individuals being placed in critical roles.

**The Verification Gap:** Manual verification by human reviewers is slow (24–72 hours per document), expensive (requires trained personnel), inconsistent (different reviewers apply different standards), and unscalable (cannot handle thousands of submissions per day).

Block ID Guard addresses this verification gap by providing automated, consistent, explainable, and scalable document verification that can process documents in under 5 seconds.

---

## 1.3 Objectives

The primary objectives of the Block ID Guard system are:

**1. Automated Multi-Format Document Processing**
- Accept PDF, JPG, JPEG, and PNG document uploads via a secure REST API.
- Extract text content from PDFs using `pdf-parse` and from images using Tesseract.js OCR (LSTM-based neural network).
- Extract image quality signals using the Sharp library (resolution, DPI, format, progressive encoding).

**2. Intelligent Document Classification**
- Classify documents into predefined categories: BANK_STATEMENT, SALARY_SLIP, ID_PROOF, or UNKNOWN using keyword-based classification.
- Detect dummy/placeholder documents through rule-based validation (word count less than 20, empty content, Lorem Ipsum detection) and semantic validation (sentence structure analysis, numeric density checks).
- Detect forgery signals through multi-signal fusion: sensitive content in low-quality images, metadata anomalies, and image quality degradation.

**3. Weighted Risk Scoring and Policy Enforcement**
- Calculate a risk score (0–100) using a weighted rule engine with the following signal weights:
  - Invalid/dummy document: +40 points
  - Suspected forgery: +50 points
  - Short content (fewer than 10 words): +20 points
  - Sensitive keywords detected: +30 points
  - Blurry/low-quality image: +25 points
  - Rapid upload pattern: +20 points
  - Multiple failures: +25 points
  - Missing user agent: +10 points
- Map risk scores to four levels: LOW (0–29), MEDIUM (30–49), HIGH (50–69), CRITICAL (70–100).
- Enforce policy decisions: AUTO-APPROVE for LOW, MANUAL REVIEW for MEDIUM, REJECT for HIGH/CRITICAL.

**4. Role-Based Access Control and Workflow Management**
- Implement JWT-based authentication with HTTP-only cookies and 15-minute token expiry.
- Enforce role-based access: CUSTOMER, SANCTION_MANAGER, ADMIN, LEAD.
- Route MEDIUM-risk documents to the sanction manager review queue.
- Allow sanction managers to make APPROVE, REJECT, or FLAG decisions with reasons.

**5. Blockchain-Inspired Immutable Audit Logging**
- Hash every audit event using SHA-256 cryptographic hashing.
- Store hashed audit logs in PostgreSQL with action type, payload, user ID, and timestamp.
- Ensure tamper-evident logging for all critical actions: DOCUMENT_UPLOADED, SANCTION_DECISION, USER_REGISTERED.

**6. Explainable AI Advisory**
- Generate human-readable explanations for every risk verdict.
- Provide specific risk reasons such as "Dummy or meaningless document detected", "Possible forged document", "Image quality too low or blurry".
- Display AI advisory panels in the frontend for both customers and sanction managers.

**7. Comprehensive Admin Oversight**
- Provide a full admin dashboard with system-wide statistics: total users, customers, documents, sanctions.
- Enable admin to view user journey tracking, sanction manager activity, audit logs, and create new sanction managers.
- Include a Demo Mode for quick access during presentations.

### 1.3.1 Scope and Limitations

**In Scope:**
- PDF, JPEG, and PNG document processing
- Text-based PDF extraction and image OCR
- Keyword-based document classification (4 categories)
- Rule-based and semantic validity detection
- Image metadata-based forgery signal detection
- Weighted risk scoring with behavioral context
- Role-based workflow (Customer, Sanction Manager, Admin)
- SHA-256 hashed audit logging
- JWT-based authentication with HTTP-only cookies

**Out of Scope (Current Version):**
- Handwritten document verification
- Video-based liveness detection
- Real-time face matching against ID photos
- Digital signature cryptographic verification
- Multi-language OCR (Hindi, Tamil, Telugu, etc.)
- Integration with government databases (Aadhaar API, DigiLocker)
- Mobile application (iOS/Android)

**Known Limitations:**
- Tesseract OCR accuracy drops below 80% for images under 150 DPI
- Keyword-based classification cannot handle terminology variations
- Forgery detection relies on metadata signals — sophisticated high-quality forgeries may not be detected
- Behavioral analytics requires historical data to be effective (cold start problem for new users)

---

## 1.4 Methodology

Block ID Guard follows a structured, layered development methodology combining modern software engineering practices with AI/ML integration patterns.

### Phase 1: Requirements Analysis and Architecture Design

The system requirements were gathered by analyzing real-world document fraud patterns and existing verification system limitations. A microservice-inspired monolithic architecture was chosen for the backend, with clear separation of concerns across:

- **Routes Layer** — Express.js route handlers for auth, documents, uploads, sanctions, and admin.
- **Controller Layer** — Business logic orchestration.
- **AI Layer** — Extractors, classifiers, validators, and orchestrators.
- **Security Layer** — Risk engine, policy engine, behavior tracker, anomaly detector, defense engine, and audit ledger.
- **Data Layer** — Prisma ORM with PostgreSQL.

### Phase 2: Database Schema Design

The PostgreSQL schema was designed using Prisma ORM with the following core models:

- `User` — Stores user credentials, role, and relationships to documents, audit logs, behavior events, and sanction decisions.
- `Document` — Stores document metadata, file path, MIME type, status, and owner reference.
- `DocumentAIExtraction` — Stores OCR/PDF text, word count, sensitive keyword flags, image quality signals, and forgery indicators.
- `DocumentRiskSnapshot` — Stores risk score, risk level, AI verdict, AI reason, policy flags, and behavior flags.
- `SanctionDecision` — Stores sanction manager decisions with reason and timestamp.
- `AuditLog` — Stores SHA-256 hashed audit events.
- `BehaviorEvent` — Stores user behavior events with IP, user agent, and metadata.

### Phase 3: Backend API Development

The backend was developed using Express.js 5 with TypeScript. Key implementation decisions:

- **Multer** for multipart file upload handling with single-file constraint.
- **Tesseract.js** for client-side OCR without external API dependencies.
- **Sharp** for high-performance image metadata extraction.
- **pdf-parse** for PDF text extraction.
- **bcrypt** (cost factor 12) for password hashing.
- **jsonwebtoken** for stateless JWT authentication.
- **Zod** for request body validation schemas.
- **Helmet** for HTTP security headers.
- **express-rate-limit** for API rate limiting.
- **Pino** for structured JSON logging.

### Phase 4: AI Pipeline Development

The AI pipeline was built as a modular, composable system:

```
┌─────────────────────────────────────────────────────────────────────┐
│                   AI PIPELINE PROCESSING FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

  USER UPLOADS DOCUMENT (PDF / JPG / PNG)
              │
              ▼
  ┌───────────────────────┐
  │  Multer Middleware     │  ← MIME type check, 5MB limit, disk save
  └──────────┬────────────┘
             │
             ▼
  ┌───────────────────────────────────────────────────┐
  │           extractDocumentSignals()                │
  │                                                   │
  │  ┌─────────────────────┐  ┌─────────────────────┐│
  │  │   extractText()     │  │ extractImageSignals()││
  │  │                     │  │                     ││
  │  │ PDF → pdf-parse     │  │ Sharp metadata read ││
  │  │ IMG → Tesseract OCR │  │ resolution, DPI,    ││
  │  │                     │  │ format, progressive ││
  │  │ → rawText           │  │ → isBlurry          ││
  │  │ → wordCount         │  │ → possibleForgery   ││
  │  │ → keywords          │  │ → notes[]           ││
  │  └─────────────────────┘  └─────────────────────┘│
  └──────────────────────┬────────────────────────────┘
                         │
                         ▼
  ┌───────────────────────────────────────────────────┐
  │           runDocumentIntelligence()               │
  │                                                   │
  │  ┌──────────────────┐  ┌──────────────────────┐  │
  │  │ classifyDocType()│  │ verifyDocumentType() │  │
  │  │ keyword matching │  │ STRICT FORMAT RULES  │  │
  │  │ BANK/SALARY/ID   │  │ Aadhaar/PAN/Bill/    │  │
  │  │ /UNKNOWN         │  │ Bank/Salary gates    │  │
  │  └──────────────────┘  └──────────────────────┘  │
  │  ┌──────────────────┐  ┌──────────────────────┐  │
  │  │ classifyValidity │  │ detectForgery()      │  │
  │  │ rule + semantic  │  │ content × quality    │  │
  │  │ word count, NLP  │  │ fusion signal        │  │
  │  └──────────────────┘  └──────────────────────┘  │
  └──────────────────────┬────────────────────────────┘
                         │
                         ▼
  ┌───────────────────────────────────────────────────┐
  │           evaluateDocumentRisk()                  │
  │                                                   │
  │  calculateRiskScore()  →  0–100 weighted score    │
  │  runPolicyEngine()     →  ALLOW/CHALLENGE/BLOCK   │
  │  generateAIAdvisory()  →  APPROVE/REVIEW/REJECT   │
  └──────────────────────┬────────────────────────────┘
                         │
                         ▼
  ┌───────────────────────────────────────────────────┐
  │  Store: DocumentAIExtraction + RiskSnapshot       │
  │  writeAuditLog() → SHA-256 hash → AuditLog table  │
  └───────────────────────────────────────────────────┘
```
*Figure 1.3 — AI Pipeline Processing Flow*

```
Document Upload
    |
    v
extractDocumentSignals()
    |-- extractText()         --> pdf-parse / Tesseract OCR
    |-- extractImageSignals() --> Sharp metadata analysis
    |
    v
runDocumentIntelligence()
    |-- classifyDocumentType()     --> keyword matching
    |-- classifyDocumentValidity() --> rule + semantic validation
    |-- detectForgerySignals()     --> multi-signal fusion
    |
    v
evaluateDocumentRisk()
    |-- calculateRiskScore()  --> weighted rule engine
    |-- runPolicyEngine()     --> risk-to-decision mapping
    |-- generateAIAdvisory()  --> human-readable explanation
    |
    v
Store: DocumentAIExtraction + DocumentRiskSnapshot
    |
    v
writeAuditLog() --> SHA-256 hashed event
```

### Phase 5: Frontend Development

The frontend was built using Next.js 16 with React 19, TypeScript, and Tailwind CSS 4. Key pages:

```
┌─────────────────────────────────────────────────────────────────────┐
│                  FRONTEND PAGES OVERVIEW (Next.js 16)               │
├──────────────────┬──────────────────────┬───────────────────────────┤
│   CUSTOMER ROLE  │  SANCTION MGR ROLE   │       ADMIN ROLE          │
├──────────────────┼──────────────────────┼───────────────────────────┤
│                  │                      │                           │
│  /login          │  /sanction-login     │  /admin/login             │
│  /register       │                      │                           │
│                  │  /sanctions          │  /admin/dashboard         │
│  /dashboard      │  ├─ Filter tabs      │  ├─ Overview tab          │
│  ├─ Doc list     │  │  (ALL/PENDING/    │  ├─ Users tab             │
│  ├─ Status badge │  │   APPROVED/etc)   │  ├─ Sanctions tab         │
│  └─ Upload btn   │  ├─ Expandable cards │  ├─ Audit Logs tab        │
│                  │  ├─ AI verdict panel │  ├─ Create User tab       │
│  /documents/     │  ├─ Integrity check  │  └─ Demo Mode tab         │
│    upload        │  │  list (✓/✗)       │                           │
│  ├─ Doc type     │  ├─ Risk score bar   │  /admin/                  │
│  │  dropdown     │  ├─ Download btn     │   create-sanction-manager │
│  ├─ File picker  │  └─ Approve/Reject/  │                           │
│  └─ Mismatch     │     Flag buttons     │                           │
│     warning      │                      │                           │
│                  │                      │                           │
│  /blocked        │                      │                           │
└──────────────────┴──────────────────────┴───────────────────────────┘
```
*Figure 1.4 — Frontend Pages Overview*

- `/login` and `/register` — Customer authentication with React Hook Form + Zod validation.
- `/dashboard` — Paginated document list with upload navigation.
- `/documents/upload` — File upload form supporting PDF, JPG, PNG.
- `/sanctions` — Sanction manager review queue with risk scores and decision buttons.
- `/admin/dashboard` — Full admin panel with tabbed navigation (Overview, Users, Sanctions, Audit, Create User, Demo Mode).
- `/admin/login` — Admin-specific authentication.
- `/sanction-login` — Sanction manager authentication.
- `/blocked` — Blocked user notification page.

### Phase 6: Security Hardening

- JWT tokens stored in HTTP-only cookies (XSS protection).
- `sameSite: "lax"` cookie policy (CSRF protection).
- 15-minute token expiry with short-lived sessions.
- Helmet middleware for security headers.
- Rate limiting on all API endpoints.
- Graceful shutdown with Prisma disconnection on SIGTERM/SIGINT.
- Input validation via Zod schemas on all POST endpoints.

### Phase 7: Testing and Validation

The system was tested with real PDF documents (sample PDFs stored in `/uploads/`) and validated across all user roles. The AI pipeline was verified to correctly classify document types, detect dummy content, and generate appropriate risk scores.

### 1.4.1 Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | Next.js | 16.1.1 | SSR, routing, API proxy |
| UI Library | React | 19.2.3 | Component-based UI |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Form Validation | React Hook Form + Zod | 7.x + 4.x | Type-safe forms |
| HTTP Client | Axios | 1.13 | API communication |
| Backend Framework | Express.js | 5.x | REST API server |
| Language | TypeScript | 5.x | Type safety |
| ORM | Prisma | 5.22 | Database access |
| Database | PostgreSQL | 15+ | Data persistence |
| OCR Engine | Tesseract.js | 7.x | Image text extraction |
| PDF Parser | pdf-parse | 2.4.5 | PDF text extraction |
| Image Processing | Sharp | 0.34.5 | Image metadata analysis |
| Authentication | jsonwebtoken + bcrypt | 9.x + 6.x | JWT auth + password hashing |
| Validation | Zod | 4.3.5 | Schema validation |
| Security | Helmet + express-rate-limit | 8.x + 8.x | HTTP security headers + rate limiting |
| Logging | Pino | 10.x | Structured JSON logging |
| Cryptography | Node.js crypto (built-in) | - | SHA-256 audit hashing |

---

## 1.5 Organization of the Report

This report is organized into five chapters, each covering a distinct aspect of the Block ID Guard system:

**Chapter 1: Introduction (Pages 1–5)**
Provides an overview of the Block ID Guard system, the problem statement motivating its development, the objectives it aims to achieve, the methodology followed during development, and the organization of this report.

**Chapter 2: Literature Survey (Pages 6–13)**
Reviews existing research and technologies in the domains of OCR, image forgery detection, machine learning for document classification, fraud detection methodologies, blockchain-inspired audit systems, and commercial document verification platforms. Identifies research gaps that Block ID Guard addresses.

**Chapter 3: System Design and Development (Pages 14–34)**
Provides a detailed technical description of the system architecture, database schema, AI pipeline components, risk scoring engine, policy enforcement, frontend design, and API structure. Includes code snippets, data flow diagrams, and component descriptions.

**Chapter 4: Performance Analysis (Pages 35–51)**
Analyzes the system's performance across multiple dimensions: document processing accuracy, risk scoring effectiveness, API response times, role-based workflow efficiency, and security posture. Includes comparative analysis with commercial solutions.

**Chapter 5: Conclusions (Pages 52–53)**
Summarizes the key contributions of Block ID Guard, discusses future enhancement opportunities, and outlines the broader application domains where the system can be deployed.

**References (Pages 54–58)**
Lists all academic papers, technical documentation, and standards referenced throughout the report.

**Appendices (Pages 59–62)**
Contains supplementary material including API endpoint documentation, database schema diagrams, environment configuration details, and sample document processing outputs.

---
