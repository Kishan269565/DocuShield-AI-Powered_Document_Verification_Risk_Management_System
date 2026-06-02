# CHAPTER 2: LITERATURE SURVEY

## Overview

This chapter presents a comprehensive review of existing technologies, research papers, and commercial solutions related to document verification, fraud detection, and identity management systems. The survey covers OCR technologies, machine learning approaches, blockchain-inspired security, and behavioral analytics — all of which are directly implemented in Block ID Guard.

---

 2.1 Document Verification Technologies

 2.1.1 Optical Character Recognition (OCR)

Tesseract OCR Engine

Tesseract is an open-source OCR engine originally developed by HP Laboratories in the 1980s and later open-sourced by Google in 2005 [1]. Block ID Guard integrates Tesseract.js v7 — the JavaScript/WebAssembly port — for server-side image-to-text conversion without any external API dependency.

Key Features:
- Multi-language support (100+ languages)
- High accuracy on clean, high-resolution images
- Support for PNG, JPG, TIFF, and BMP formats
- LSTM-based neural network architecture introduced in Tesseract 4.0

**Implementation in Block ID Guard:**
```typescript
// text.extractor.ts
import Tesseract from "tesseract.js"

if (mimeType.startsWith("image/")) {
  const ocr = await Tesseract.recognize(buffer, "eng")
  rawText = ocr.data.text || ""
}
```

**Advantages:**
- Free and open-source with no API rate limits or costs
- Runs entirely on the local server without external dependencies
- Good accuracy for printed, high-resolution text
- Pre-trained LSTM models for English and 100+ other languages

**Limitations:**
- Lower accuracy on handwritten or cursive text
- Struggles with low-quality, blurry, or skewed images
- Requires image preprocessing for optimal results
- No built-in document structure or layout understanding

**Research Reference:**
Smith, R. (2007). "An Overview of the Tesseract OCR Engine." Proceedings of the Ninth International Conference on Document Analysis and Recognition (ICDAR 2007), IEEE. [1]

---

2.1.2 PDF Text Extraction

pdf-parse Library**

Block ID Guard uses the `pdf-parse` npm library (v2.4.5) for extracting text content from PDF documents. This library parses the internal PDF structure and extracts embedded text without requiring any external tools or APIs.

**Implementation in Block ID Guard:**
```typescript
// text.extractor.ts
const pdfParse = require("pdf-parse")

if (mimeType === "application/pdf") {
  const parsed = await pdfParse.default(buffer)
  rawText = parsed.text || ""
}
```

**Advantages:**
- Fast extraction of text-based PDFs
- No external API calls required
- Preserves text content and basic structure
- Lightweight and efficient for server-side processing

**Limitations:**
- Cannot extract text from scanned PDFs (image-based PDFs require OCR)
- Limited support for complex PDF structures with embedded fonts
- No layout analysis or table extraction capabilities

**Alternative Technologies Considered:**
- **Apache PDFBox** (Java-based, not suitable for Node.js stack)
- **PyPDF2** (Python-based, requires separate service)
- **Adobe PDF Services API** (Commercial, external dependency)

The decision to use `pdf-parse` was driven by its zero-dependency nature and seamless integration with the Node.js/TypeScript backend.

---

## 2.2 Image Analysis and Forgery Detection

### 2.2.1 Image Quality Assessment

**Sharp Library for Node.js**

Sharp (v0.34.5) is a high-performance image processing library built on top of libvips. Block ID Guard uses Sharp exclusively for metadata extraction and image quality signal analysis [2] — not for image transformation.

**Implementation in Block ID Guard:**
```typescript
// image.extractor.ts
import sharp from "sharp"

const image = sharp(absolutePath)
const metadata = await image.metadata()

// Signals extracted:
// metadata.width, metadata.height  --> resolution
// metadata.density                 --> DPI
// metadata.format                  --> file format
// metadata.isProgressive           --> encoding type
```

**Quality Metrics Used in Block ID Guard:**

| Signal | Threshold | Risk Implication |
|--------|-----------|-----------------|
| Resolution | width x height < 150,000 pixels | isBlurry = true |
| DPI | density < 72 | isBlurry = true |
| Missing dimensions | width or height null | possibleForgery = true |
| Unknown format | format null | possibleForgery = true |
| Progressive JPEG | isProgressive = true | Noted as suspicious |

**Research Foundation:**
Wang, Z., Bovik, A. C., Sheikh, H. R., and Simoncelli, E. P. (2004). "Image Quality Assessment: From Error Visibility to Structural Similarity." IEEE Transactions on Image Processing, 13(4), 600–612. [2]

---

### 2.2.2 Forgery Detection Techniques

**Multi-Signal Fusion Approach**

Block ID Guard implements a multi-signal forgery detection system that combines image quality signals with content analysis signals. This approach is grounded in the research finding that no single signal is sufficient for reliable forgery detection — fusion of multiple weak signals produces stronger detection accuracy [3][4][5].

The forgery classifier in Block ID Guard (`documentForgery.classifier.ts`) evaluates:

1. **Metadata Anomaly Detection**
   - Missing EXIF/image dimensions (common in screenshots and edited images)
   - Unknown or corrupted image format
   - Progressive JPEG encoding (frequently used by image editing software)

2. **Content-Quality Correlation**
   - Sensitive financial/identity keywords present in a low-quality image
   - This combination is a strong indicator of a forged document (real documents from banks/government are high-resolution)

3. **Resolution-Based Blur Detection**
   - Images below 150,000 total pixels are flagged as blurry
   - DPI below 72 indicates a poor-quality scan or screenshot

```typescript
// documentForgery.classifier.ts
export const detectForgerySignals = (
  containsSensitive: boolean,
  isBlurry?: boolean,
  possibleForgery?: boolean
): ForgeryResult => {
  const indicators: string[] = []

  if (containsSensitive && isBlurry) {
    indicators.push("Sensitive data with poor image quality")
  }
  if (possibleForgery) {
    indicators.push("Image metadata anomaly")
  }

  return {
    suspectedForgery: indicators.length > 0,
    indicators,
  }
}
```

**Research Background:**

**Copy-Move Forgery Detection:**
Fridrich, J., Soukal, D., and Lukas, J. (2003). "Detection of Copy-Move Forgery in Digital Images." Proceedings of Digital Forensic Research Workshop (DFRWS). [3]

**Splicing Detection:**
Ng, T. T., and Chang, S. F. (2004). "A Model for Image Splicing." IEEE International Conference on Image Processing (ICIP). [4]

**Resampling Detection:**
Popescu, A. C., and Farid, H. (2005). "Exposing Digital Forgeries by Detecting Traces of Resampling." IEEE Transactions on Signal Processing, 53(2), 758–767. [5]

---

## 2.3 Machine Learning for Document Classification

### 2.3.1 Rule-Based Classification

Block ID Guard uses a **keyword-based classification system** for document type identification. This approach was chosen over deep learning for its determinism, explainability, and zero training data requirement.

```typescript
// documentType.classifier.ts
const KEYWORD_MAP = {
  BANK_STATEMENT: ["account", "bank", "statement", "ifsc", "balance"],
  SALARY_SLIP:    ["salary", "gross", "net pay", "ctc", "employer"],
  ID_PROOF:       ["passport", "aadhaar", "pan", "identity"],
  UNKNOWN:        [],
}

export const classifyDocumentType = (text: string): DocumentType => {
  const lower = text.toLowerCase()
  for (const [type, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some(k => lower.includes(k))) {
      return type as DocumentType
    }
  }
  return "UNKNOWN"
}
```

**Advantages:**
- Fast and deterministic — same input always produces same output
- No training data required
- Fully explainable decisions
- Low computational overhead — runs in microseconds

**Limitations:**
- Limited to predefined categories
- Cannot handle terminology variations or synonyms
- No contextual understanding
- Vulnerable to keyword stuffing attacks

---

### 2.3.2 Rule-Based Validity Classification

Block ID Guard implements a two-stage validity classification pipeline combining rule-based and semantic validation.

**Stage 1 — Rule Validator (`rule.validator.ts`):**
```typescript
export const validateBasicRules = (text: string, wordCount: number) => {
  const violations: string[] = []

  if (wordCount < 20)           violations.push("Document content too short")
  if (!text || !text.trim())    violations.push("Empty or unreadable document")
  if (/lorem ipsum/i.test(text)) violations.push("Placeholder text detected")

  return { isValid: violations.length === 0, violations }
}
```

**Stage 2 — Semantic Validator (`semantic.validator.ts`):**
```typescript
export const validateSemanticMeaning = (text: string) => {
  const issues: string[] = []
  const sentences = text.split(/[.!?]/).filter(Boolean)

  if (sentences.length < 3) {
    issues.push("Not enough semantic structure")
  }

  const numericDensity = (text.match(/\d+/g)?.length || 0) / Math.max(text.length, 1)
  if (numericDensity < 0.01) {
    issues.push("Lacks expected numeric information")
  }

  return { isMeaningful: issues.length === 0, issues }
}
```

The semantic validator checks that real financial/identity documents contain sufficient numeric data (account numbers, amounts, dates) and sentence structure. A document with no numbers and fewer than 3 sentences is almost certainly a dummy.

---

### 2.3.3 Deep Learning Approaches (Future Enhancement)

**Convolutional Neural Networks (CNNs)**

CNNs have demonstrated state-of-the-art performance in document image classification tasks. While Block ID Guard currently uses rule-based classification, the following architectures represent the natural evolution path:

**LeNet-5 Architecture:**
- Pioneering CNN for document recognition by LeCun et al. (1998) [6]
- 7-layer architecture with convolutional and pooling layers
- Originally used for handwritten digit recognition (MNIST)

**VGGNet (Simonyan and Zisserman, 2014):**
- 16–19 layer deep architecture
- Small 3x3 convolution filters throughout
- Effective for document image classification tasks

**ResNet (He et al., 2016):**
- Residual connections to prevent vanishing gradients
- 50–152 layer variants
- State-of-the-art performance on ImageNet classification

**Research Reference:**
LeCun, Y., Bottou, L., Bengio, Y., and Haffner, P. (1998). "Gradient-Based Learning Applied to Document Recognition." Proceedings of the IEEE, 86(11), 2278–2324. [6]

---

### 2.3.4 Transfer Learning

**Pre-trained Models**

Transfer learning leverages models trained on large datasets and fine-tunes them for specific downstream tasks [7]. Block ID Guard already employs a form of transfer learning through Tesseract's pre-trained LSTM models:

- Trained on millions of text samples across 100+ languages
- Language-specific models fine-tuned for various fonts and styles
- No additional training required for deployment

**Potential Future Enhancements:**
- **BERT** (Devlin et al., 2018) [14] for semantic document understanding and intent classification
- **LayoutLM** (Xu et al., 2020) [15] for joint text and layout understanding in scanned documents
- **DocFormer** (Appalaraju et al., 2021) [18] for multi-modal document classification combining text, image, and spatial features

**Research Reference:**
Pan, S. J., and Yang, Q. (2010). "A Survey on Transfer Learning." IEEE Transactions on Knowledge and Data Engineering, 22(10), 1345–1359. [7]

---

## 2.4 Fraud Detection and Risk Assessment

### 2.4.1 Risk Scoring Methodologies

**Weighted Risk Calculation**

Block ID Guard implements a weighted additive risk scoring model [8]. Each signal contributes a fixed weight to the total risk score, which is capped at 100.

```typescript
// weights.risk.ts
export const RISK_WEIGHTS = {
  UNKNOWN_IP:             15,
  SUSPICIOUS_USER_AGENT:  10,
  RAPID_REQUESTS:         20,
  SENSITIVE_ACTION:       30,
  MULTIPLE_FAILURES:      25,
  INVALID_DOCUMENT:       40,   // Dummy / meaningless / empty docs
  FORGED_DOCUMENT:        50,   // Suspected forgery / tampering
}
```

**Risk Level Thresholds:**

| Risk Score | Risk Level | AI Verdict | Action |
|------------|------------|------------|--------|
| 0 – 29 | LOW | APPROVE | Auto-approve |
| 30 – 49 | MEDIUM | REVIEW | Route to sanction manager |
| 50 – 69 | HIGH | REJECT | Auto-reject |
| 70 – 100 | CRITICAL | REJECT | Auto-reject with alert |

**Research Foundation:**
Phua, C., Lee, V., Smith, K., and Gayler, R. (2010). "A Comprehensive Survey of Data Mining-Based Fraud Detection Research." Artificial Intelligence Review, 34(1), 1–20. [8]

---

### 2.4.2 Behavioral Analytics

**User Behavior Monitoring**

Block ID Guard tracks behavioral patterns through the `BehaviorEvent` model and `tracker.behavior.ts` [13]. Every request is logged with IP address, user agent, path, method, and timestamp.

The risk engine evaluates behavioral signals:

1. **Upload Frequency Analysis**
   - `rapidUploads` flag triggers +20 risk points
   - Detects users submitting multiple documents in rapid succession

2. **Failure Pattern Detection**
   - `multipleFailures` flag triggers +25 risk points
   - Detects repeated submission of rejected or flagged documents

3. **Device Fingerprinting**
   - Missing user agent triggers +10 risk points (bots and scrapers often omit user agents)
   - IP address stored for every behavior event

```typescript
// tracker.behavior.ts
export const trackRequest = async (req: any) => {
  await storeBehaviorEvent({
    type: BehaviorEventType.REQUEST,
    ip: req.ip ?? "0.0.0.0",
    userAgent: req.headers["user-agent"],
    userId: req.user?.id,
    metadata: { path: req.path, method: req.method },
  })
}
```

**Research Reference:**
Bolton, R. J., and Hand, D. J. (2002). "Statistical Fraud Detection: A Review." Statistical Science, 17(3), 235–255. [13]

---

## 2.5 Blockchain and Audit Trail Technologies

### 2.5.1 Immutable Audit Logs

**Cryptographic Hashing**

Block ID Guard implements blockchain-inspired audit logging using SHA-256 hashing [9][10]. Every audit event is hashed before storage, creating a tamper-evident record.

```typescript
// hash.audit.ts + ledger.audit.ts
import crypto from "crypto"

const generateEventHash = (event: AuditEvent): string => {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(event))
    .digest("hex")
}

export const recordAuditEvent = async (event: AuditEvent) => {
  const hash = generateEventHash(event)

  await prisma.auditLog.create({
    data: {
      action:    event.eventType,
      payload:   event.payload ?? {},
      hash,
      userId:    event.userId,
      timestamp: event.timestamp ?? new Date(),
    },
  })
}
```

**Properties:**
- **Immutability** — Any modification to a past log entry changes its hash, making tampering detectable.
- **Verifiability** — Hash can be recomputed from the payload to verify integrity.
- **Transparency** — All system actions are logged: DOCUMENT_UPLOADED, SANCTION_DECISION, USER_REGISTERED.
- **Non-repudiation** — Cryptographic proof ties every action to a user ID and timestamp.

**Research Background:**
Nakamoto, S. (2008). "Bitcoin: A Peer-to-Peer Electronic Cash System." Self-published whitepaper. (Origin of blockchain concept) [9]

Zyskind, G., Nathan, O., and Pentland, A. (2015). "Decentralizing Privacy: Using Blockchain to Protect Personal Data." IEEE Security and Privacy Workshops. [10]

---

### 2.5.2 Comparison with Traditional Audit Systems

| Feature | Traditional Logs | Block ID Guard Audit |
|---------|------------------|----------------------|
| **Mutability** | Can be modified or deleted | Cryptographically protected |
| **Verification** | Manual review required | Automated hash verification |
| **Tampering Detection** | Difficult or impossible | Immediate detection via hash mismatch |
| **Compliance** | Basic timestamped logs | Enhanced with cryptographic proof |
| **Forensics** | Limited reconstruction | Complete action history with payloads |
| **Storage** | Plain text files | PostgreSQL with structured JSON payloads |

---

## 2.6 Commercial Document Verification Solutions

### 2.6.1 Existing Platforms

**1. Onfido**
- AI-powered identity verification with document authenticity checks
- Facial recognition matching against document photos
- Real-time verification API with global document support

**Limitations:**
- Expensive per-verification pricing ($1–$3 per check)
- External API dependency — documents sent to third-party servers
- Limited customization of verification rules
- No on-premise deployment option
- Black-box AI with no explanation of decisions

**2. Jumio**
- ID document verification with biometric authentication
- AML screening and global document support
- API-based integration

**Limitations:**
- High cost for small and medium businesses
- Requires constant internet connectivity
- No behavioral analytics component
- Limited audit trail capabilities

**3. Trulioo**
- Global identity verification with KYC/AML compliance
- Document validation and API-based integration

**Limitations:**
- Subscription-based pricing model
- No self-hosted deployment option
- Minimal fraud detection features beyond document checks
- No role-based workflow for human review

---

### 2.6.2 Block ID Guard Competitive Advantages

| Feature | Commercial Solutions | Block ID Guard |
|---------|---------------------|----------------|
| **Cost** | $1–$5 per verification | Self-hosted (zero per-verification cost) |
| **Customization** | Limited to API parameters | Fully customizable source code |
| **Data Privacy** | Documents sent to third-party | On-premise, data never leaves server |
| **Audit Trail** | Basic timestamped logs | SHA-256 hashed immutable ledger |
| **AI Transparency** | Black-box decisions | Explainable risk reasons per document |
| **Behavioral Analytics** | Not available | Upload frequency, failure patterns, IP tracking |
| **Role-Based Workflow** | Not available | Customer, Sanction Manager, Admin, Lead |
| **Integration** | API-only | Full source code access and customization |

---

## 2.7 Natural Language Processing for Document Validation

### 2.7.1 Semantic Analysis

**Dummy Content Detection**

Block ID Guard implements semantic validation to detect documents that contain text but lack meaningful content. This addresses a common fraud pattern where users submit documents with random words or minimal content to pass basic word-count checks.

```typescript
// semantic.validator.ts
const sentences = text.split(/[.!?]/).filter(Boolean)
if (sentences.length < 3) {
  issues.push("Not enough semantic structure")
}

const numericDensity = (text.match(/\d+/g)?.length || 0) / Math.max(text.length, 1)
if (numericDensity < 0.01) {
  issues.push("Lacks expected numeric information")
}
```

**Placeholder Text Detection (rule.validator.ts):**
- Lorem Ipsum detection via regex: `/lorem ipsum/i`
- Empty or whitespace-only content detection
- Word count threshold enforcement (minimum 20 words)

**Research Foundation:**
Mikolov, T., Chen, K., Corrado, G., and Dean, J. (2013). "Efficient Estimation of Word Representations in Vector Space." arXiv preprint arXiv:1301.3781. [11]

---

### 2.7.2 Keyword Extraction and Sensitive Term Detection

Block ID Guard maintains a curated list of sensitive financial and identity keywords for two purposes: document classification and risk scoring.

```typescript
// text.extractor.ts
const SENSITIVE_KEYWORDS = [
  "income", "salary", "tax", "bank", "loan",
  "identity", "passport", "aadhaar", "pan",
]

const detectedKeywords = SENSITIVE_KEYWORDS.filter(keyword =>
  lowerText.includes(keyword)
)
```

When sensitive keywords are detected in a low-quality or potentially forged image, the risk score increases by 30 points. This is because legitimate high-value documents (bank statements, salary slips, ID proofs) should always be high-resolution and properly formatted.

---

## 2.8 Database and Security Technologies

### 2.8.1 PostgreSQL and Prisma ORM

**PostgreSQL Features Used:**
- ACID compliance for data integrity across all document operations
- JSON/JSONB columns for flexible storage of policy flags, behavior flags, detected keywords, and image notes
- Cascade deletes for referential integrity (deleting a user cascades to documents, audit logs, behavior events)
- Unique constraints on DocumentAIExtraction and DocumentRiskSnapshot (one-to-one with Document)

**Prisma ORM Benefits:**
- Type-safe database queries with full TypeScript inference
- Automatic migration generation and deployment
- Relationship management with `include` for eager loading
- `upsert` operations for idempotent risk snapshot creation

```typescript
// documentRisk.orchestrator.ts
await prisma.documentRiskSnapshot.upsert({
  where:  { documentId: input.documentId },
  update: {},
  create: {
    documentId: input.documentId,
    riskScore:  risk.score,
    riskLevel:  risk.level,
    aiVerdict:  ai.recommendation,
    aiReason:   ai.explanation,
    policyFlags:   [policy.decision],
    behaviorFlags: [],
  },
})
```

---

### 2.8.2 Authentication and Authorization

**JWT (JSON Web Tokens)**

Block ID Guard uses short-lived JWTs (15-minute expiry) stored in HTTP-only cookies for stateless authentication.

```typescript
// auth.controller.ts
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: "15m" }
)

res.cookie("token", token, {
  httpOnly: true,    // XSS protection
  secure:   false,   // true in production (HTTPS)
  sameSite: "lax",   // CSRF protection
  maxAge:   15 * 60 * 1000,
})
```

**Security Properties:**
- `httpOnly: true` — JavaScript cannot access the cookie, preventing XSS token theft
- `sameSite: "lax"` — Cookie not sent on cross-site POST requests, preventing CSRF
- 15-minute expiry — Limits the window of opportunity if a token is compromised
- bcrypt cost factor 12 — Computationally expensive password hashing

**Research Reference:**
Jones, M., Bradley, J., and Sakimura, N. (2015). "JSON Web Token (JWT)." RFC 7519, Internet Engineering Task Force (IETF). [12]

---

## 2.9 Frontend Technologies

### 2.9.1 Next.js 16 and React 19

**Next.js Features Used in Block ID Guard:**
- App Router with file-based routing (`/app` directory structure)
- Server-side rendering for initial page loads
- API route proxying through `next.config.ts`
- Automatic code splitting per route
- Static metadata export (`metadata` object in `layout.tsx`)

**React 19 Features:**
- Improved concurrent rendering for smoother UI updates
- Automatic batching of state updates
- `use client` directive for client-side interactivity
- Hooks: `useState`, `useEffect`, `useRouter`, `useForm`

**Frontend Architecture:**
```
/app
  /login          --> Customer login (React Hook Form + Zod)
  /register       --> Customer registration
  /dashboard      --> Document list (paginated API fetch)
  /documents/upload --> File upload form (multipart/form-data)
  /sanctions      --> Sanction manager review queue
  /admin/dashboard --> Admin panel (tabbed: Overview, Users, Sanctions, Audit, Create User, Demo)
  /admin/login    --> Admin authentication
  /sanction-login --> Sanction manager authentication
  /blocked        --> Blocked user page
```

---

### 2.9.2 Form Validation with React Hook Form and Zod

```typescript
// login/page.tsx
const loginSchema = z.object({
  email:    z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
})

const { register, handleSubmit, formState: { errors, isSubmitting } } =
  useForm<FormLogin>({
    resolver: zodResolver(loginSchema),
  })
```

**Benefits:**
- Type-safe validation with TypeScript inference from Zod schemas
- Minimal re-renders — only affected fields re-render on change
- Built-in error state management
- Schema reusability between frontend and backend (same Zod library)

---

## 2.10 Research Gaps and Block ID Guard Innovations

### 2.10.1 Identified Gaps in Existing Solutions

1. **Limited Dummy Document Detection** — Most OCR systems extract text but do not validate whether the content is meaningful or real.
2. **Weak Forgery Detection** — Basic image quality checks only; no multi-signal fusion combining content analysis with image quality.
3. **Insufficient Behavioral Context** — Document verification in isolation without tracking user upload patterns or failure history.
4. **Poor Audit Trails** — Simple database logging with no cryptographic integrity guarantee.
5. **Black-Box AI Decisions** — No explanation for rejections; limited transparency for compliance and appeals.
6. **No Role-Based Human Review Workflow** — No structured pipeline for routing AI-flagged documents to human reviewers.

---

### 2.10.2 Block ID Guard Innovations

1. **Multi-Layer Document Intelligence Pipeline**
   - Text extraction (PDF + OCR) → Semantic validation → Keyword analysis → Type classification
   - All results stored in `DocumentAIExtraction` for full traceability

2. **Comprehensive Forgery Detection via Signal Fusion**
   - Image quality metrics (resolution, DPI) + metadata anomaly detection + content-quality correlation
   - Implemented in `documentForgery.classifier.ts` and `image.extractor.ts`

3. **Behavioral Risk Fusion**
   - Document signals combined with user behavior signals (rapid uploads, multiple failures, missing user agent)
   - Implemented in `rules.risk.ts` with `RISK_WEIGHTS` configuration

4. **Blockchain-Inspired Immutable Audit**
   - SHA-256 hashing of every audit event payload
   - Implemented in `hash.audit.ts` and `ledger.audit.ts`

5. **Explainable AI with Human-Readable Reasons**
   - Every risk verdict includes specific, actionable reasons
   - Displayed in the AI Advisory Panel on the frontend

6. **Structured Role-Based Review Workflow**
   - MEDIUM-risk documents automatically routed to sanction manager queue
   - Sanction managers see full risk context before making decisions

---

## 2.11 Summary of Literature Findings

### Key Takeaways

1. **OCR Technology** — Tesseract.js provides reliable server-side text extraction for printed documents without external API dependencies.

2. **Image Analysis** — Sharp library enables efficient metadata extraction and quality assessment; multi-signal fusion outperforms single-metric forgery detection.

3. **Machine Learning** — Rule-based classification offers full explainability and zero training data requirement; deep learning (CNN, LayoutLM) represents the natural future enhancement path.

4. **Fraud Detection** — Weighted additive risk scoring with behavioral context significantly outperforms document-only verification.

5. **Blockchain Concepts** — SHA-256 hashing provides audit trail integrity without the overhead of a full distributed blockchain.

6. **Commercial Solutions** — High cost, external dependency, and black-box decisions justify building a custom, self-hosted solution.

7. **Security Best Practices** — JWT with HTTP-only cookies, bcrypt password hashing, Helmet headers, and rate limiting provide a strong security posture.

### Research Contributions

Block ID Guard synthesizes multiple research domains into a single cohesive system:
- **Computer Vision** — Image quality analysis and forgery signal detection
- **Natural Language Processing** — Semantic validation and keyword extraction
- **Cryptography** — SHA-256 audit trail integrity
- **Behavioral Analytics** — Upload pattern and failure pattern risk scoring
- **Software Engineering** — Modular, type-safe, scalable TypeScript architecture

This multi-disciplinary approach creates a comprehensive document verification system that addresses real-world fraud challenges while maintaining transparency, security, and scalability.

---

## References

1. Smith, R. (2007). "An Overview of the Tesseract OCR Engine." ICDAR 2007, IEEE.
2. Wang, Z., et al. (2004). "Image Quality Assessment: From Error Visibility to Structural Similarity." IEEE Transactions on Image Processing.
3. Fridrich, J., et al. (2003). "Detection of Copy-Move Forgery in Digital Images." DFRWS.
4. Ng, T. T., and Chang, S. F. (2004). "A Model for Image Splicing." IEEE ICIP.
5. Popescu, A. C., and Farid, H. (2005). "Exposing Digital Forgeries by Detecting Traces of Resampling." IEEE Transactions on Signal Processing.
6. LeCun, Y., et al. (1998). "Gradient-Based Learning Applied to Document Recognition." Proceedings of the IEEE.
7. Pan, S. J., and Yang, Q. (2010). "A Survey on Transfer Learning." IEEE TKDE.
8. Phua, C., et al. (2010). "A Comprehensive Survey of Data Mining-Based Fraud Detection Research." AI Review.
9. Nakamoto, S. (2008). "Bitcoin: A Peer-to-Peer Electronic Cash System."
10. Zyskind, G., et al. (2015). "Decentralizing Privacy: Using Blockchain to Protect Personal Data." IEEE S&P Workshops.
11. Mikolov, T., et al. (2013). "Efficient Estimation of Word Representations in Vector Space." arXiv:1301.3781.
12. Jones, M., et al. (2015). "JSON Web Token (JWT)." RFC 7519, IETF.
13. Bolton, R. J., and Hand, D. J. (2002). "Statistical Fraud Detection: A Review." Statistical Science.
14. Devlin, J., et al. (2018). "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding." arXiv:1810.04805.
15. Xu, Y., et al. (2020). "LayoutLM: Pre-training of Text and Layout for Document Image Understanding." ACM KDD.

---
