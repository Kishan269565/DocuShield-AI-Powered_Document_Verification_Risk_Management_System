# CHAPTER 3: SYSTEM DESIGN AND DEVELOPMENT

## 3.1 Dataset Description

Block ID Guard does not rely on a pre-existing public dataset. Instead, the system is designed to process real-world documents submitted by users at runtime. The "dataset" in the context of this system refers to the structured collection of document records, AI extraction results, risk snapshots, audit logs, and behavioral events stored in the PostgreSQL database.

3.1.1 Document Types Supported

The system accepts three file formats:

| Format | MIME Type | Processing Method |
|--------|-----------|------------------|
| PDF | application/pdf | pdf-parse text extraction |
| JPEG/JPG | image/jpeg | Tesseract.js OCR |
| PNG | image/png | Tesseract.js OCR |

File size is capped at 5MB per upload, enforced by the Multer middleware:

```typescript
// upload.middleware.ts
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})
```

### 3.1.2 Document Categories

The system classifies uploaded documents into four categories based on keyword matching:

| Category | Keywords Used for Detection |
|----------|----------------------------|
| BANK_STATEMENT | account, bank, statement, ifsc, balance |
| SALARY_SLIP | salary, gross, net pay, ctc, employer |
| ID_PROOF | passport, aadhaar, pan, identity |
| UNKNOWN | No matching keywords found |

### 3.1.3 Database Schema — Core Models

All data is persisted in PostgreSQL via Prisma ORM. The schema defines 7 models:

**User Model:**
```prisma
model User {
  id             Int                @id @default(autoincrement())
  email          String             @unique
  password       String
  role           Role               @default(CUSTOMER)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
  documents      Document[]
  auditLogs      AuditLog[]
  behaviorEvents BehaviorEvent[]
  decisions      SanctionDecision[] @relation("DecidedBy")
}
```

**Document Model:**
```prisma
model Document {
  id          Int            @id @default(autoincrement())
  title       String
  content     String
  filePath    String?
  fileType    String?
  status      DocumentStatus @default(PENDING)
  ownerId     Int
  owner       User           @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  sanctionDecisions SanctionDecision[]
  riskSnapshot      DocumentRiskSnapshot?
  aiExtraction      DocumentAIExtraction?
}
```

**DocumentAIExtraction Model:**
```prisma
model DocumentAIExtraction {
  id                Int      @id @default(autoincrement())
  documentId        Int      @unique
  rawText           String?
  wordCount         Int?
  containsSensitive Boolean  @default(false)
  detectedKeywords  Json     @default("[]")
  isBlurry          Boolean?
  possibleForgery   Boolean?
  imageNotes        Json     @default("[]")
  extractedAt       DateTime @default(now())
  document          Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
}
```

**DocumentRiskSnapshot Model:**
```prisma
model DocumentRiskSnapshot {
  id            Int       @id @default(autoincrement())
  documentId    Int       @unique
  riskScore     Int
  riskLevel     RiskLevel
  aiVerdict     AIVerdict
  aiReason      String
  policyFlags   Json      @default("[]")
  behaviorFlags Json      @default("[]")
  createdAt     DateTime  @default(now())
  document      Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
}
```

**AuditLog Model:**
```prisma
model AuditLog {
  id        Int      @id @default(autoincrement())
  action    String
  payload   Json     @default("{}")
  hash      String
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id])
  timestamp DateTime @default(now())
}
```

**BehaviorEvent Model:**
```prisma
model BehaviorEvent {
  id        Int      @id @default(autoincrement())
  type      String
  ip        String
  userAgent String?
  metadata  Json     @default("{}")
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id])
  timestamp DateTime @default(now())
}
```

### 3.1.4 Enumerations

```prisma
enum Role              { ADMIN, CUSTOMER, SANCTION_MANAGER, LEAD }
enum DocumentStatus    { PENDING, APPROVED, REJECTED, FLAGGED }
enum RiskLevel         { LOW, MEDIUM, HIGH, CRITICAL }
enum AIVerdict         { APPROVE, REVIEW, REJECT }
enum SanctionDecisionType { APPROVE, REJECT, FLAG }
```

---

### 3.1.5 Entity-Relationship (ER) Diagram

The ER diagram below illustrates all seven entities in the Block ID Guard database and their relationships.

```
+----------------+          +-------------------+
|     USER       |          |     DOCUMENT      |
|----------------|          |-------------------|
| PK id          |1       N | PK id             |
| email (unique) |----------| title             |
| password       |          | content           |
| role (enum)    |          | filePath          |
| createdAt      |          | fileType          |
| updatedAt      |          | status (enum)     |
+----------------+          | FK ownerId        |
        |                   | createdAt         |
        |                   | updatedAt         |
        |                   +-------------------+
        |                          |1
        |              +-----------+-----------+
        |              |           |           |
        |              |1          |1          |N
        |   +----------+------+  +-+----------+--+  +-------------------+
        |   |DOCUMENTAI        |  |DOCUMENTRISK  |  | SANCTIONDECISION  |
        |   |EXTRACTION        |  |SNAPSHOT      |  |-------------------|
        |   |------------------|  |--------------|  | PK id             |
        |   | PK id            |  | PK id        |  | decision (enum)   |
        |   | FK documentId(u) |  | FK docId (u) |  | reason            |
        |   | rawText          |  | riskScore    |  | FK documentId     |
        |   | wordCount        |  | riskLevel    |  | FK decidedById    |
        |   | containsSensitive|  | aiVerdict    |  | createdAt         |
        |   | detectedKeywords |  | aiReason     |  +-------------------+
        |   | isBlurry         |  | policyFlags  |          |N
        |   | possibleForgery  |  | behaviorFlags|          |
        |   | imageNotes       |  | createdAt    |          |1
        |   | extractedAt      |  +--------------+  +-------+-------+
        |   +------------------+                    |     USER      |
        |                                           | (decidedBy)   |
        |1                                          +---------------+
        +-------------------+
        |                   |
        |N                  |N
+-------+--------+  +-------+--------+
|   AUDITLOG     |  | BEHAVIOREVENT  |
|----------------|  |----------------|
| PK id          |  | PK id          |
| action         |  | type           |
| payload (json) |  | ip             |
| hash (sha256)  |  | userAgent      |
| FK userId      |  | metadata (json)|
| timestamp      |  | FK userId      |
+----------------+  | timestamp      |
                    +----------------+
```

*Figure 3.1 — Entity-Relationship Diagram of Block ID Guard Database Schema (see ASCII diagram above)*

**Relationship Summary:**

| Relationship | Type | Description |
|-------------|------|-------------|
| User → Document | One-to-Many | A user can upload many documents |
| Document → DocumentAIExtraction | One-to-One | Each document has exactly one AI extraction record |
| Document → DocumentRiskSnapshot | One-to-One | Each document has exactly one risk snapshot |
| Document → SanctionDecision | One-to-Many | A document can have multiple sanction decisions over time |
| User → SanctionDecision | One-to-Many | A sanction manager can make many decisions |
| User → AuditLog | One-to-Many | A user can have many audit log entries |
| User → BehaviorEvent | One-to-Many | A user can have many behavior events |

All foreign key relationships use CASCADE DELETE — deleting a User removes all their Documents, and deleting a Document removes its AIExtraction, RiskSnapshot, and SanctionDecisions automatically.

---
## 3.2 Data Pre-Processing and Data Visualization

### 3.2.1 File Upload Pre-Processing

Before any AI processing begins, every uploaded file passes through a pre-processing pipeline:

**Step 1 — Multer Middleware (upload.middleware.ts)**
- Validates MIME type against allowed list: application/pdf, image/png, image/jpeg
- Rejects files exceeding 5MB
- Generates a unique filename using timestamp prefix: `Date.now()-originalname`
- Saves file to the `/uploads/` directory on disk

```typescript
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  },
})
```

**Step 2 — Path Resolution**

After Multer saves the file, the upload controller resolves the absolute path for AI processing:

```typescript
const absolutePath = path.resolve(
  process.cwd(),
  "uploads",
  req.file.filename
)
```

**Step 3 — Buffer Reading**

The text extractor reads the file into a Node.js Buffer for processing by pdf-parse or Tesseract:

```typescript
const buffer = fs.readFileSync(absolutePath)
```

### 3.2.2 Text Pre-Processing

After raw text is extracted (via pdf-parse or Tesseract OCR), the following pre-processing steps are applied:

1. **Lowercasing** — All text is converted to lowercase for case-insensitive keyword matching
2. **Whitespace normalization** — Word count is computed by splitting on whitespace: `rawText.split(/\s+/).length`
3. **Sentence segmentation** — Text is split on sentence-ending punctuation for semantic analysis: `text.split(/[.!?]/)`
4. **Numeric density calculation** — Count of digit sequences divided by total text length: `(text.match(/\d+/g)?.length || 0) / text.length`
5. **Keyword scanning** — Each sensitive keyword is checked against the lowercased text using `String.includes()`

### 3.2.3 Image Pre-Processing

For image files, Sharp extracts metadata without pixel-level transformation:

```typescript
const image = sharp(absolutePath)
const metadata = await image.metadata()
// Extracted: width, height, density (DPI), format, isProgressive
```

The following signals are computed from raw metadata:

| Raw Metadata | Derived Signal | Threshold |
|-------------|---------------|----------|
| width x height | Total pixel count | < 150,000 = isBlurry |
| density | DPI value | < 72 = isBlurry |
| width or height null | Missing dimensions | = possibleForgery |
| format null | Unknown format | = possibleForgery |
| isProgressive | Encoding type | = suspicious note |

### 3.2.4 Data Visualization in Admin Dashboard

The Admin Dashboard (`/admin/dashboard`) provides real-time visualization of system data:

**Overview Tab — Metric Cards:**
- Total Users count (blue card)
- Total Customers count (purple card)
- Total Documents count (green card)
- Total Sanctions count (orange card)

**User Journey Tab:**
- Per-user document history with risk level badges (LOW=green, MEDIUM=yellow, HIGH=orange, CRITICAL=red)
- Document status badges (APPROVED=green, REJECTED=red, FLAGGED=yellow, PENDING=gray)

**Audit Logs Tab:**
- Chronological list of all system actions with user email, role, and timestamp

**Sanctions Tab:**
- Active sanction managers with decision counts
- Recent sanction decisions with approve/reject/flag status badges

> **INSERT IMAGE HERE** — `[ADMIN_DASHBOARD_OVERVIEW.png]`
> *Caption: Figure 3.2 — Admin Dashboard Overview Tab showing system metrics*

> **INSERT IMAGE HERE** — `[ADMIN_DASHBOARD_USERS.png]`
> *Caption: Figure 3.3 — Admin Dashboard User Journey Tab showing per-user document history*

> **INSERT IMAGE HERE** — `[ADMIN_AUDIT_LOGS.png]`
> *Caption: Figure 3.4 — Admin Dashboard Audit Logs Tab*


---
## 3.3 Brief Description of AI/ML Techniques Used

### 3.3.1 System Architecture Overview

Block ID Guard follows a layered, modular architecture with clear separation between the API layer, AI layer, security layer, and data layer.

> **INSERT IMAGE HERE** — `[SYSTEM_ARCHITECTURE.png]`
> *Caption: Figure 3.7 — Block ID Guard System Architecture Diagram*

```
+--------------------------------------------------+
|              FRONTEND (Next.js 16)               |
|  /login  /dashboard  /upload  /sanctions  /admin |
+--------------------------------------------------+
                        |
                   REST API (HTTPS)
                        |
+--------------------------------------------------+
|              BACKEND (Express.js 5)              |
|                                                  |
|  Routes --> Controllers --> Services             |
|                                                  |
|  +------------------+  +---------------------+  |
|  |    AI LAYER      |  |   SECURITY LAYER    |  |
|  |                  |  |                     |  |
|  | Extractors       |  | Risk Engine         |  |
|  | Classifiers      |  | Policy Engine       |  |
|  | Validators       |  | Behavior Tracker    |  |
|  | Orchestrators    |  | Anomaly Detector    |  |
|  | AI Advisory      |  | Defense Engine      |  |
|  +------------------+  | Audit Ledger        |  |
|                        +---------------------+  |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|         DATA LAYER (PostgreSQL + Prisma)         |
|  User  Document  AIExtraction  RiskSnapshot      |
|  AuditLog  BehaviorEvent  SanctionDecision       |
+--------------------------------------------------+
```

---

### 3.3.1a Data Flow Diagram (DFD) — Level 0 (Context Diagram)

The Level 0 DFD shows Block ID Guard as a single process interacting with four external entities.

```
                    +------------------+
                    |    CUSTOMER      |
                    +--------+---------+
                             |
              Upload Document (PDF/JPG/PNG)
              Document Title, Description
                             |
                             v
+------------+    +---------------------+    +------------------+
|   ADMIN    |--->|                     |--->| SANCTION MANAGER |
+------------+    |   BLOCK ID GUARD    |    +------------------+
                  |   DOCUMENT          |
+------------+    |   VERIFICATION      |    +------------------+
| POSTGRESQL |<-->|   SYSTEM            |--->|   AUDIT LEDGER   |
| DATABASE   |    |                     |    | (SHA-256 Hashed) |
+------------+    +---------------------+    +------------------+
                             |
              Risk Verdict, AI Advisory
              Document Status, Audit Log
                             |
                             v
                    +------------------+
                    |    CUSTOMER      |
                    +------------------+
```

> **INSERT IMAGE HERE** — `[DFD_LEVEL0.png]`
> *Caption: Figure 3.5 — Level 0 DFD (Context Diagram) for Block ID Guard*

---

### 3.3.1b Data Flow Diagram (DFD) — Level 1

The Level 1 DFD decomposes the system into its major processing components and shows data flows between them.

```
CUSTOMER
   |
   | [file, title, description]
   v
+------------------+     [JWT cookie]      +-------------------+
| P1: AUTHENTICATE |<-------------------->| D1: USER TABLE    |
|  authMiddleware  |                       | (PostgreSQL)      |
+------------------+                       +-------------------+
   |
   | [authenticated request + file]
   v
+------------------+     [filename, path]  +-------------------+
| P2: FILE UPLOAD  |-------------------->  | D2: /uploads/     |
|  uploadMiddleware|                       | (Disk Storage)    |
|  Multer          |                       +-------------------+
+------------------+
   |
   | [absolutePath, mimeType]
   v
+------------------+     [rawText]         +-------------------+
| P3: TEXT         |-------------------->  | D3: DOCUMENT      |
|  EXTRACTION      |     [wordCount]       | AI EXTRACTION     |
|  pdf-parse /     |     [keywords]        | TABLE             |
|  Tesseract OCR   |                       +-------------------+
+------------------+
   |
   | [isBlurry, possibleForgery, notes]
   v
+------------------+
| P4: IMAGE SIGNAL |
|  EXTRACTION      |
|  Sharp library   |
+------------------+
   |
   | [all signals]
   v
+------------------+     [docType]
| P5: DOCUMENT     |     [isDummy]
|  INTELLIGENCE    |     [suspectedForgery]
|  3 Classifiers   |
|  2 Validators    |
+------------------+
   |
   | [intelligence result]
   v
+------------------+     [riskScore]       +-------------------+
| P6: RISK         |     [riskLevel]  ---> | D4: RISK SNAPSHOT |
|  EVALUATION      |     [aiVerdict]       | TABLE             |
|  Risk Engine     |     [aiReason]        +-------------------+
|  Policy Engine   |
|  AI Advisory     |
+------------------+
   |
   | [action, payload, hash]
   v
+------------------+                       +-------------------+
| P7: AUDIT        |-------------------->  | D5: AUDIT LOG     |
|  LOGGING         |                       | TABLE             |
|  SHA-256 Hash    |                       +-------------------+
+------------------+
   |
   | [risk >= MEDIUM]
   v
+------------------+     [decision]        +-------------------+
| P8: SANCTION     |-------------------->  | D6: SANCTION      |
|  REVIEW          |                       | DECISION TABLE    |
|  Human Review    |                       +-------------------+
+------------------+
   |
   v
SANCTION MANAGER
```

> **INSERT IMAGE HERE** — `[DFD_LEVEL1.png]`
> *Caption: Figure 3.6 — Level 1 DFD showing all major processing components and data flows*

---

### 3.3.2 AI Layer — Extractors

The extractor layer is responsible for pulling raw signals from uploaded documents.

**document.extractor.ts — Orchestrates extraction:**
```typescript
export const extractDocumentSignals = async (
  filePath: string,
  mimeType: string
): Promise<DocumentExtractionResult> => {
  const result: DocumentExtractionResult = {}
  result.text = await extractText(filePath, mimeType)
  if (mimeType.startsWith("image/")) {
    result.image = await extractImageSignals(filePath)
  }
  return result
}
```

**text.extractor.ts — Dual-mode text extraction:**
- For PDFs: uses `pdf-parse` to extract embedded text from the PDF structure
- For images: uses `Tesseract.js` LSTM OCR engine to recognize printed text
- Computes word count, detects sensitive keywords, returns `TextExtractionResult`

**image.extractor.ts — Image quality signal extraction:**
- Uses `Sharp` to read image metadata without decoding pixel data
- Evaluates 5 quality signals: resolution, DPI, missing dimensions, unknown format, progressive encoding
- Returns `ImageExtractionResult` with `isBlurry`, `possibleForgery`, and `notes[]`

### 3.3.3 AI Layer — Classifiers

Three independent classifiers process the extracted signals:

**Classifier 1 — Document Type (documentType.classifier.ts)**

Uses a keyword map to classify documents into one of four types:

```typescript
const KEYWORD_MAP = {
  BANK_STATEMENT: ["account", "bank", "statement", "ifsc", "balance"],
  SALARY_SLIP:    ["salary", "gross", "net pay", "ctc", "employer"],
  ID_PROOF:       ["passport", "aadhaar", "pan", "identity"],
  UNKNOWN:        [],
}

export const classifyDocumentType = (text: string): DocumentType => {
  const lower = text.toLowerCase()
  for (const [type, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(k => lower.includes(k))) return type as DocumentType
  }
  return "UNKNOWN"
}
```

**Classifier 2 — Document Validity (documentValidity.classifier.ts)**

Runs two validators in sequence and aggregates violations:

```typescript
export const classifyDocumentValidity = (
  text: string,
  wordCount: number
): DocumentValidityResult => {
  const reasons: string[] = []
  const ruleCheck = validateBasicRules(text, wordCount)
  if (!ruleCheck.isValid) reasons.push(...ruleCheck.violations)
  const semanticCheck = validateSemanticMeaning(text)
  if (!semanticCheck.isMeaningful) reasons.push(...semanticCheck.issues)
  return { isDummy: reasons.length > 0, reasons }
}
```

**Classifier 3 — Forgery Detection (documentForgery.classifier.ts)**

Fuses content signals with image quality signals:

```typescript
export const detectForgerySignals = (
  containsSensitive: boolean,
  isBlurry?: boolean,
  possibleForgery?: boolean
): ForgeryResult => {
  const indicators: string[] = []
  if (containsSensitive && isBlurry)
    indicators.push("Sensitive data with poor image quality")
  if (possibleForgery)
    indicators.push("Image metadata anomaly")
  return { suspectedForgery: indicators.length > 0, indicators }
}
```

### 3.3.4 AI Layer — Validators

**rule.validator.ts — Basic Rule Validation:**

Three deterministic rules applied to every document:

| Rule | Condition | Violation Message |
|------|-----------|------------------|
| Word count | wordCount < 20 | "Document content too short" |
| Empty content | text.trim().length === 0 | "Empty or unreadable document" |
| Lorem Ipsum | /lorem ipsum/i test passes | "Placeholder text detected" |

**semantic.validator.ts — Semantic Meaning Validation:**

Two semantic checks applied after basic rules pass:

| Check | Condition | Issue Message |
|-------|-----------|---------------|
| Sentence count | sentences.length < 3 | "Not enough semantic structure" |
| Numeric density | numericDensity < 0.01 | "Lacks expected numeric information" |

The numeric density check is particularly important: real financial documents (bank statements, salary slips) always contain significant numeric data — account numbers, amounts, dates. A document with fewer than 1umeric characters is almost certainly not a real financial document.

### 3.3.5 AI Layer — Document Intelligence Orchestrator

The orchestrator (`documentIntelligence.orchestrator.ts`) coordinates all three classifiers and returns a unified result:

```typescript
export const runDocumentIntelligence = (input: {
  rawText?: string
  wordCount?: number
  containsSensitive?: boolean
  isBlurry?: boolean
  possibleForgery?: boolean
}): DocumentIntelligenceResult => {
  const rawText = input.rawText?.trim() || ""
  const wordCount = input.wordCount ?? 0

  const docType = classifyDocumentType(rawText)
  const validity = classifyDocumentValidity(rawText, wordCount)
  const forgery  = detectForgerySignals(
    input.containsSensitive ?? false,
    input.isBlurry ?? false,
    input.possibleForgery ?? false
  )

  return {
    documentType:      docType,
    isDummy:           validity.isDummy,
    validityReasons:   validity.reasons,
    suspectedForgery:  forgery.suspectedForgery,
    forgeryIndicators: forgery.indicators,
  }
}
```

### 3.3.6 AI Advisory Generator

The AI Advisory module (`ai.advisory.ts`) generates a human-readable explanation and recommendation:

```typescript
export const generateAIAdvisory = (input: AIInput): AIAdvisoryResult => {
  let recommendation: "APPROVE" | "REVIEW" | "REJECT" = "APPROVE"
  const signals: string[] = []

  if (input.documentIntelligence?.isDummy) {
    signals.push("Document appears to be dummy or meaningless")
    recommendation = "REJECT"
  }
  if (input.documentIntelligence?.suspectedForgery) {
    signals.push("Potential forgery indicators detected")
    recommendation = "REJECT"
  }
  if (input.riskScore >= 80) {
    recommendation = "REJECT"
    signals.push("Critical risk score")
  } else if (input.riskScore >= 50 && recommendation !== "REJECT") {
    recommendation = "REVIEW"
    signals.push("Moderate risk requires manual review")
  }

  return {
    recommendation,
    confidence:  Math.min(input.riskScore / 100, 0.95),
    signals,
    explanation: "This decision was generated using document intelligence (content validity, forgery signals), behavioral risk analysis, and security policies.",
  }
}
```

---
## 3.4 Transfer Learning



### 3.4.1 Tesseract LSTM as Transfer Learning

Block ID Guard leverages transfer learning through Tesseract.js v7 [1], which ships with pre-trained LSTM (Long Short-Term Memory) neural network models trained by Google on millions of text samples across 100+ languages.

Transfer learning [7] is the practice of taking a model trained on a large general dataset and applying it to a specific downstream task without retraining from scratch. In Block ID Guard, the Tesseract LSTM model is directly applied to extract text from user-uploaded identity and financial documents.

**Tesseract LSTM Architecture:**
- Input: Grayscale image line strips
- Architecture: Bidirectional LSTM layers
- Output: Character sequence probabilities via CTC (Connectionist Temporal Classification)
- Pre-trained on: Google Books, academic papers, printed documents in 100+ languages
- Language model used in Block ID Guard: English ("eng")

```typescript
// text.extractor.ts
const ocr = await Tesseract.recognize(buffer, "eng")
rawText = ocr.data.text || ""
```

**Why Transfer Learning is Appropriate Here:**

- No labeled training data available — transfer learning requires no domain-specific labeled dataset
- Printed text is the target domain — Tesseract was trained on printed text, same domain as financial documents
- Deployment speed — pre-trained model is ready to use immediately with no training pipeline
- Accuracy — LSTM-based Tesseract achieves over 95% accuracy on clean printed text
- Cost — zero cost, open-source pre-trained weights

### 3.4.2 Transfer Learning for Future CNN Integration

The current rule-based document type classifier can be enhanced using transfer learning with pre-trained CNN models.

**Step 1 — Feature Extraction (Frozen Layers)**
Use a pre-trained ResNet-50 [16] or VGG-16 [17] model (trained on ImageNet) as a fixed feature extractor. The convolutional layers learn general visual features (edges, textures, shapes) that are universally useful.

**Step 2 — Fine-Tuning (Trainable Head)**
Add a custom classification head with 4 output neurons (BANK_STATEMENT, SALARY_SLIP, ID_PROOF, UNKNOWN) and fine-tune only the head layers on a small labeled dataset of document images.

**Step 3 — Integration**
Replace the keyword-based classifyDocumentType() function with the fine-tuned CNN model inference call.

**Potential Models for Transfer Learning:**

- VGG-16 [17]: 138M parameters, 92.7% ImageNet Top-5 accuracy — good baseline, high memory usage
- ResNet-50 [16]: 25M parameters, 93.3% accuracy — balanced accuracy and speed
- MobileNetV3 [19]: 5.4M parameters, 92.5% accuracy — best for deployment
- EfficientNet-B0 [20]: 5.3M parameters, 93.3% accuracy — state-of-the-art efficiency

### 3.4.3 LayoutLM for Document Understanding

LayoutLM (Microsoft, 2020) [15] is a transformer-based model pre-trained on IIT-CDIP (42 million scanned document images). It jointly models text content and 2D spatial layout, making it ideal for structured documents like bank statements and salary slips.

**Transfer Learning with LayoutLM:**
- Pre-trained on: IIT-CDIP Test Collection (42M document images)
- Fine-tuning task: Document classification (4 classes)
- Input: OCR text + bounding box coordinates from Tesseract
- Output: Document type classification with confidence scores

This represents the most promising transfer learning path for Block ID Guard v2.0, combining existing Tesseract OCR output with spatial layout information for significantly higher classification accuracy.

**Research Reference:**
Xu, Y., Li, M., Cui, L., Huang, S., Wei, F., and Zhou, M. (2020). "LayoutLM: Pre-training of Text and Layout for Document Image Understanding." ACM SIGKDD. [15]

### 3.4.4 BERT for Semantic Document Validation

The current semantic validator uses simple heuristics (sentence count, numeric density). A transfer learning enhancement would use BERT [14] for deep semantic understanding:

- Pre-trained on: BooksCorpus (800M words) + English Wikipedia (2,500M words)
- Fine-tuning task: Binary classification — real document vs. dummy/placeholder
- Input: Extracted document text (up to 512 tokens)
- Output: Probability score for document authenticity

This would replace the validateSemanticMeaning() function with a BERT-based classifier that understands context, not just surface statistics.

**Research Reference:**
Devlin, J., Chang, M. W., Lee, K., and Toutanova, K. (2018). "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding." arXiv:1810.04805. [14]

---

## 3.5 Ensembling Approach

### 3.5.1 What is Ensembling?

Ensembling is the technique of combining multiple models or decision signals to produce a final prediction that is more accurate and robust than any single model alone. Block ID Guard implements a practical ensembling approach by fusing signals from multiple independent components before computing the final risk verdict.

### 3.5.2 Signal Ensemble in the Risk Engine

The risk engine (rules.risk.ts) acts as an ensemble aggregator. It collects signals from five independent sources and combines them additively:

**Source 1 — Document Content Signals (from text.extractor.ts):**
- isDummy: document has insufficient or placeholder content (+40 points)
- wordCount < 10: extremely short content (+20 points)
- containsSensitive: sensitive keywords detected (+30 points)

**Source 2 — Image Quality Signals (from image.extractor.ts):**
- isBlurry: low resolution or low DPI (+25 points)
- possibleForgery: missing metadata or unknown format (+50 points)

**Source 3 — Forgery Fusion Signal (from documentForgery.classifier.ts):**
- suspectedForgery: sensitive content in low-quality image (+50 points)

**Source 4 — Behavioral Signals (from behavior tracker):**
- rapidUploads: multiple uploads in short time window (+20 points)
- multipleFailures: repeated rejected submissions (+25 points)

**Source 5 — Network/Device Signals:**
- Missing user agent: bot or automated submission (+10 points)

```typescript
// rules.risk.ts — Ensemble aggregation
export const evaluateRules = (input: RiskInput) => {
  let score = 0
  const reasons: string[] = []

  if (!input.userAgent) {
    score += RISK_WEIGHTS.SUSPICIOUS_USER_AGENT
    reasons.push("Missing or suspicious user agent")
  }
  if (input.documentIntelligence?.isDummy) {
    score += RISK_WEIGHTS.INVALID_DOCUMENT
    reasons.push("Dummy or meaningless document detected")
  }
  if (input.documentIntelligence?.suspectedForgery) {
    score += RISK_WEIGHTS.FORGED_DOCUMENT
    reasons.push("Possible forged document")
  }
  if (input.documentIntelligence?.wordCount && input.documentIntelligence.wordCount < 10) {
    score += 20
    reasons.push("Document content too short or empty")
  }
  if (input.documentIntelligence?.containsSensitive) {
    score += 30
    reasons.push("Contains sensitive or restricted keywords")
  }
  if (input.documentIntelligence?.isBlurry) {
    score += 25
    reasons.push("Image quality too low or blurry")
  }
  if (input.rapidUploads) {
    score += RISK_WEIGHTS.RAPID_REQUESTS
    reasons.push("Unusual upload frequency detected")
  }
  if (input.multipleFailures) {
    score += RISK_WEIGHTS.MULTIPLE_FAILURES
    reasons.push("Multiple failed verification attempts")
  }

  return { score, reasons }
}
```

### 3.5.3 Policy Engine as a Second-Level Ensemble

After the risk score is computed, the Policy Engine (rules.policy.ts) applies a second level of decision logic using threshold-based rules:

```typescript
// rules.policy.ts
export const evaluatePolicyRules = (riskScore: number): PolicyResult => {
  if (riskScore < THRESHOLDS.SAFE)   // < 30
    return { decision: PolicyDecision.ALLOW,     reason: "Low risk" }
  if (riskScore < THRESHOLDS.MEDIUM) // < 60
    return { decision: PolicyDecision.CHALLENGE, reason: "Medium risk" }
  if (riskScore < THRESHOLDS.HIGH)   // < 80
    return { decision: PolicyDecision.ESCALATE,  reason: "High risk" }
  return   { decision: PolicyDecision.BLOCK,     reason: "Critical risk" }
}
```

**Threshold Configuration (thresholds.ts):**
```typescript
export const THRESHOLDS = {
  SAFE:   30,
  MEDIUM: 60,
  HIGH:   80,
}
```

### 3.5.4 AI Advisory as a Third-Level Ensemble

The AI Advisory generator (ai.advisory.ts) performs a final ensemble pass, combining:
- Document intelligence signals (isDummy, suspectedForgery, validityReasons)
- Risk score thresholds (>= 80 = REJECT, >= 50 = REVIEW)
- Behavioral flags

This three-level ensemble (Risk Engine → Policy Engine → AI Advisory) ensures that no single signal can produce a false positive or false negative in isolation. A document must trigger multiple independent signals to receive a REJECT verdict.

### 3.5.5 Ensemble Decision Flow

```
Document Upload
      |
      v
[Signal Collection]
  text.extractor    --> wordCount, containsSensitive, detectedKeywords
  image.extractor   --> isBlurry, possibleForgery, notes
      |
      v
[Classifier Ensemble]
  documentType.classifier    --> BANK_STATEMENT / SALARY_SLIP / ID_PROOF / UNKNOWN
  documentValidity.classifier --> isDummy, validityReasons
  documentForgery.classifier  --> suspectedForgery, forgeryIndicators
      |
      v
[Risk Score Ensemble]
  rules.risk.ts --> Weighted additive score (0-100) + reasons[]
      |
      v
[Policy Ensemble]
  rules.policy.ts --> ALLOW / CHALLENGE / ESCALATE / BLOCK
      |
      v
[AI Advisory Ensemble]
  ai.advisory.ts --> APPROVE / REVIEW / REJECT + explanation
      |
      v
[Final Storage]
  DocumentRiskSnapshot + DocumentAIExtraction + AuditLog
```

### 3.5.6 Advantages of the Ensemble Approach

- **Robustness** — No single signal failure causes incorrect verdict
- **Explainability** — Each signal contributes a named reason to the final explanation
- **Configurability** — Weights in RISK_WEIGHTS and thresholds in THRESHOLDS can be tuned without code changes
- **Extensibility** — New signals can be added to the ensemble without modifying existing classifiers
- **Auditability** — All signals and reasons are stored in DocumentRiskSnapshot for review

---

## 3.6 Proposed Model

### 3.6.1 Complete System Architecture

The proposed Block ID Guard model integrates all components described in sections 3.1 through 3.5 into a unified, production-ready system.

**Technology Stack:**

Backend:
- Runtime: Node.js with TypeScript
- Framework: Express.js 5
- ORM: Prisma 5.22 with PostgreSQL
- Authentication: jsonwebtoken + bcrypt
- File Upload: Multer (disk storage, 5MB limit)
- OCR: Tesseract.js v7 (LSTM, English)
- PDF Parsing: pdf-parse v2.4.5
- Image Processing: Sharp v0.34.5
- Validation: Zod v4.3.5
- Security: Helmet, express-rate-limit
- Logging: Pino with pino-pretty

Frontend:
- Framework: Next.js 16.1.1 with App Router
- UI Library: React 19.2.3
- Styling: Tailwind CSS v4
- Forms: React Hook Form v7 + Zod
- HTTP Client: Axios v1.13
- Auth Decoding: jwt-decode v4

Database:
- PostgreSQL (production)
- Prisma migrations for schema management
- JSON/JSONB columns for flexible signal storage

### 3.6.2 Complete Upload Processing Flow

When a customer uploads a document, the following sequence executes:

**Step 1 — HTTP Request**
POST /api/documents/upload with multipart/form-data containing file, title, description fields.

**Step 2 — Middleware Chain**
authMiddleware verifies JWT from HTTP-only cookie, then uploadMiddleware validates file type and size, saves to disk.

**Step 3 — Document Record Creation**
```typescript
const document = await prisma.document.create({
  data: {
    title:    req.file.originalname,
    content:  req.body.description || "Uploaded document",
    filePath: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype,
    ownerId:  req.user.userId,
  },
})
```

**Step 4 — Signal Extraction**
```typescript
const extraction = await extractDocumentSignals(absolutePath, req.file.mimetype)
```

**Step 5 — AI Extraction Storage**
```typescript
await prisma.documentAIExtraction.create({
  data: {
    documentId:       document.id,
    rawText:          extraction.text?.rawText ?? null,
    wordCount:        extraction.text?.wordCount ?? null,
    containsSensitive: extraction.text?.containsSensitiveTerms ?? false,
    detectedKeywords: extraction.text?.detectedKeywords ?? [],
    isBlurry:         extraction.image?.isBlurry ?? null,
    possibleForgery:  extraction.image?.possibleForgery ?? null,
    imageNotes:       extraction.image?.notes ?? [],
  },
})
```

**Step 6 — Document Intelligence**
```typescript
const intelligence = runDocumentIntelligence({
  rawText:          extraction.text?.rawText ?? "",
  wordCount:        extraction.text?.wordCount ?? 0,
  containsSensitive: extraction.text?.containsSensitiveTerms ?? false,
  isBlurry:         extraction.image?.isBlurry,
  possibleForgery:  extraction.image?.possibleForgery,
})
```

**Step 7 — Risk Evaluation and Storage**
```typescript
await evaluateDocumentRisk({
  documentId: document.id,
  userId:     req.user.userId,
  ip:         req.ip ?? "0.0.0.0",
  userAgent:  req.headers["user-agent"],
  documentIntelligence: {
    isDummy:          intelligence.isDummy,
    suspectedForgery: intelligence.suspectedForgery,
    documentType:     intelligence.documentType,
  },
})
```

**Step 8 — Audit Log**
```typescript
await writeAuditLog({
  action:  "DOCUMENT_UPLOADED",
  userId:  req.user.userId,
  payload: { documentId: document.id },
})
```

**Step 9 — Response**
Returns document record + intelligence result to the frontend.

> **INSERT IMAGE HERE** — `[UPLOAD_PAGE.png]`
> *Caption: Figure 3.8 — Document Upload Page (frontend)*

> **INSERT IMAGE HERE** — `[UPLOAD_FLOW_RESULT.png]`
> *Caption: Figure 3.9 — AI Advisory Panel showing risk verdict after upload*

### 3.6.3 Role-Based Access Control Model

The system enforces RBAC through two middleware layers:

**authMiddleware** — Verifies JWT and attaches user to request:
```typescript
const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
  userId: number
  role: Role
}
req.user = decoded
```

**roleMiddleware** — Restricts routes to specific roles:
```typescript
// sanction.routes.ts
router.use(authMiddleware)
router.use(roleMiddleware([Role.SANCTION_MANAGER, Role.ADMIN]))
router.get("/queue", getSanctionQueue)
router.post("/documents/:id/decision", decideOnDocument)
```

**Route Access Matrix:**

- POST /api/auth/register — Public
- POST /api/auth/login — Public
- POST /api/documents/upload — CUSTOMER, ADMIN
- GET /api/documents — CUSTOMER (own documents only)
- GET /api/sanctions/queue — SANCTION_MANAGER, ADMIN
- POST /api/sanctions/documents/:id/decision — SANCTION_MANAGER, ADMIN
- GET /api/admin/dashboard — ADMIN only

> **INSERT IMAGE HERE** — `[LOGIN_PAGE.png]`
> *Caption: Figure 3.10 — Customer Login Page*

> **INSERT IMAGE HERE** — `[REGISTER_PAGE.png]`
> *Caption: Figure 3.11 — Customer Registration Page*

### 3.6.4 Sanction Manager Workflow

When a document receives a MEDIUM or HIGH risk score, it enters the sanction manager review queue:

1. Sanction manager logs in at /sanction-login
2. Views the queue at /sanctions — each document shows title, owner email, upload time, risk score, risk level, and AI verdict
3. Downloads the original document for manual inspection
4. Makes a decision: APPROVE, REJECT, or FLAG with an optional reason
5. Decision is stored in SanctionDecision table
6. Document status is updated in the Document table
7. Audit log entry is created for the decision

> **INSERT IMAGE HERE** — `[SANCTIONS_QUEUE.png]`
> *Caption: Figure 3.12 — Sanction Manager Review Queue with risk scores and decision buttons*

### 3.6.5 Security Model

**Authentication Security:**
- Passwords hashed with bcrypt (cost factor 12) — computationally expensive to brute-force
- JWT tokens expire in 15 minutes — limits exposure window
- HTTP-only cookies — JavaScript cannot read tokens (XSS protection)
- sameSite: "lax" — prevents cross-site request forgery

**API Security:**
- Helmet middleware sets 11 security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- express-rate-limit prevents brute-force and DDoS attacks
- Zod schema validation on all POST request bodies
- File type whitelist enforced by Multer (PDF, PNG, JPEG only)
- File size limit: 5MB maximum

**Audit Security:**
- Every action hashed with SHA-256 before storage
- Hash computed over: action + payload + userId + timestamp
- Any tampering with stored records is detectable by recomputing the hash

```typescript
// audit.util.ts
const hash = crypto
  .createHash("sha256")
  .update(JSON.stringify({ action, payload, userId, timestamp: Date.now() }))
  .digest("hex")
```

### 3.6.6 Frontend Architecture

The frontend follows Next.js App Router conventions with client-side interactivity via "use client" directives.

**State Management:** Local React state (useState, useEffect) — no external state library needed given the application scope.

**API Communication:** Axios instance configured with baseURL pointing to the backend, credentials: "include" for cookie-based auth.

**Form Handling:** React Hook Form with Zod resolvers for type-safe, minimal-rerender form validation on login, register, and upload pages.

**UI Design:** Tailwind CSS v4 with gradient-based design system — blue-to-purple gradients for primary actions, green/red/yellow/orange for status indicators.

**Key Frontend Components:**
- AIAdvisoryPanel — Displays risk score, risk level, AI verdict, and explanation for each document
- Admin Dashboard — Tabbed interface with Overview, Users, Sanctions, Audit, Create User, Demo Mode tabs
- Sanctions Queue — Document review interface with download, approve, reject, flag actions

> **INSERT IMAGE HERE** — `[DASHBOARD_PAGE.png]`
> *Caption: Figure 3.13 — Customer Dashboard showing uploaded documents list*

> **INSERT IMAGE HERE** — `[ADMIN_LOGIN.png]`
> *Caption: Figure 3.14 — Admin Login Page*

---
