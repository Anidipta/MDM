# Mini Document Manager (MDM)

A modern, full-stack document management system built with React (Vite) and Node.js (Express). Features a pixel-art inspired UI with teal and coral color scheme.

<img src="client/src/assets/logo-MDM.png" alt="MDM Logo" width="80" />

---

## 🚀 Setup & Run Instructions

### Prerequisites
- Node.js (v14+ recommended)
- npm

### 1. Start Backend Server
```bash
cd server
npm install
node index.js
```
Server runs on `http://localhost:3001`

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`

---

## ⚙️ Setup Assumptions

1. **Local Development**: Both client and server run on localhost (ports 5173 and 3001)
2. **File System Access**: Server has read/write permissions to `uploads/` directory
3. **No External DB**: Uses local JSON file (`db.json`) for metadata storage
4. **No Cloud Storage**: Files stored on local disk, not S3/GCS
5. **Single User**: No authentication/authorization (demo purposes)
6. **Modern Browser**: Assumes browser supports CSS Grid, Fetch API, and ES6+

---

## 🔀 Key Tradeoffs (Due to Time Limit)

| Decision | Tradeoff |
|----------|----------|
| **JSON Database** | Simple & zero-config, but lacks ACID properties and query performance of PostgreSQL/MongoDB |
| **No Authentication** | Focus on core functionality; production would use JWT middleware |
| **Local File Storage** | Easy setup, but not scalable; S3 would be used in production |
| **Single-Request Batch Upload** | Simpler UX, but large batches may timeout; chunked uploads would be more robust |
| **Inline Preview** | Uses browser's native rendering; advanced preview (DOC/DOCX) would need server-side conversion |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│                         (React + Vite)                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │   Header    │  │ DocumentGrid│  │ UploadModal │  │ PreviewPanel  │  │
│  │ (Search,    │  │ (Card View) │  │ (File Select│  │ (PDF/TXT/MD   │  │
│  │  Sort, Nav) │  │             │  │  + Upload)  │  │  Viewer)      │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────┘  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP (REST API)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                    │
│                         (Node.js + Express)                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         REST API                                 │   │
│  │  GET /documents          - List with search, sort, pagination    │   │
│  │  POST /documents         - Upload files (multipart/form-data)    │   │
│  │  GET /documents/:id/view - Stream file inline (for preview)      │   │
│  │  GET /documents/:id/download - Stream file as attachment         │   │
│  │  DELETE /documents/:id   - Delete single document                │   │
│  │  POST /documents/delete-bulk - Delete multiple documents         │   │
│  │  POST /documents/download-zip - Bulk download as ZIP             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                        │
│              ┌─────────────────┼─────────────────┐                      │
│              ▼                                   ▼                      │
│  ┌─────────────────────┐           ┌─────────────────────┐              │
│  │     db.json         │           │     uploads/        │              │
│  │  (Metadata Store)   │           │   (File Storage)    │              │
│  │  - id, title, size  │           │   - Actual files    │              │
│  │  - mimetype, date   │           │   - Unique names    │              │
│  └─────────────────────┘           └─────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📤 Upload Flow

```
┌──────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────┐
│  User    │      │   Frontend   │      │   Backend    │      │  Storage │
└────┬─────┘      └──────┬───────┘      └──────┬───────┘      └────┬─────┘
     │                   │                     │                   │
     │ 1. Select Files   │                     │                   │
     │──────────────────>│                     │                   │
     │                   │                     │                   │
     │                   │ 2. FormData with    │                   │
     │                   │    multiple files   │                   │
     │                   │────────────────────>│                   │
     │                   │                     │                   │
     │                   │                     │ 3. Multer parses  │
     │                   │                     │    multipart data │
     │                   │                     │──────────────────>│
     │                   │                     │                   │
     │                   │                     │ 4. Save to disk   │
     │                   │                     │    (streaming)    │
     │                   │                     │──────────────────>│
     │                   │                     │                   │
     │                   │                     │ 5. Update db.json │
     │                   │                     │    with metadata  │
     │                   │                     │                   │
     │                   │ 6. Success response │                   │
     │                   │<────────────────────│                   │
     │                   │                     │                   │
     │ 7. Refresh grid   │                     │                   │
     │<──────────────────│                     │                   │
     │                   │                     │                   │
```

---

## 📥 Download Flow

```
┌──────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────┐
│  User    │      │   Frontend   │      │   Backend    │      │  Storage │
└────┬─────┘      └──────┬───────┘      └──────┬───────┘      └────┬─────┘
     │                   │                     │                   │
     │ 1. Click Download │                     │                   │
     │──────────────────>│                     │                   │
     │                   │                     │                   │
     │                   │ 2. GET /download    │                   │
     │                   │────────────────────>│                   │
     │                   │                     │                   │
     │                   │                     │ 3. Lookup in      │
     │                   │                     │    db.json        │
     │                   │                     │                   │
     │                   │                     │ 4. Create read    │
     │                   │                     │    stream         │
     │                   │                     │<──────────────────│
     │                   │                     │                   │
     │                   │ 5. Stream chunks    │                   │
     │                   │    to client        │                   │
     │                   │<════════════════════│                   │
     │                   │  (Content-Disposition: attachment)      │
     │                   │                     │                   │
     │ 6. Browser saves  │                     │                   │
     │    file to disk   │                     │                   │
     │<──────────────────│                     │                   │
     │                   │                     │                   │
```

---

## 📝 Design Questions

### 1. Multiple Uploads
**How does your system handle uploading multiple documents?**

- **One Request**: The frontend uses `FormData` to append multiple files under the same key (`files`). The backend accepts `multipart/form-data` and processes the array of files in a single HTTP POST request via Multer.
  
- **Limits & Tradeoffs**:
  | Approach | Pros | Cons |
  |----------|------|------|
  | Single batch request | Atomic operation, less HTTP overhead | May hit server limits (body size, timeout) |
  | Per-file requests | Better for large files, individual retry | More HTTP connections, complex progress tracking |

  *Current implementation*: Batch upload with progress bar. For production, chunked uploads (e.g., using `tus` protocol) would handle very large files.

---

### 2. Streaming
**Why is streaming important for upload/download?**

| Aspect | With Streaming | Without Streaming |
|--------|----------------|-------------------|
| **Memory** | O(1) - constant ~64KB chunks | O(n) - entire file in RAM |
| **Concurrency** | Handle 100+ downloads | 5-10 large downloads = OOM |
| **Time to First Byte** | Immediate | Wait for full file read |
| **Event Loop** | Non-blocking | Blocked during read/write |

**Problems without streaming:**
- **Out of Memory (OOM)**: Node.js heap limit (~2GB). A few concurrent 500MB downloads crash the server.
- **High Latency**: User waits for server to fully read file before receiving first byte.
- **Blocked Event Loop**: Synchronous file reads freeze all other requests.

*Current implementation*: Uses `fs.createReadStream()` to pipe file chunks directly to HTTP response.

---

### 3. Moving to S3
**If files move to object storage (e.g., S3):**

| Component | Current (Local) | With S3 |
|-----------|-----------------|---------|
| Upload | Multer → disk | Presigned POST URL → direct to S3 |
| Download | fs.createReadStream → pipe | Presigned GET URL → direct from S3 |
| Delete | fs.unlinkSync | S3.deleteObject() |
| Backend Role | Handle file bytes | Manage metadata + generate presigned URLs |

**Would the backend still handle file bytes?**
- **Ideally No**. The backend becomes a *metadata & authorization* service:
  1. Generate presigned URLs for upload/download
  2. Store/query metadata in database
  3. Verify permissions before generating URLs
  
- **Benefits**: Offloads bandwidth from API server, leverages S3's global CDN, enables direct browser ↔ S3 transfers.

---

### 4. Frontend UX
**If you had more time:**

#### Document Preview (Implemented ✅)
- **Current**: PDF uses `<embed>`, text/md/json use `<iframe>` with inline content-type
- **Enhancement**: 
  - Server-side thumbnail generation (Sharp for images, pdf-poppler for PDFs)
  - DOC/DOCX conversion to PDF or HTML using LibreOffice headless

#### Upload Progress (Implemented ✅)
- **Current**: Total batch progress bar using Axios `onUploadProgress`
- **Enhancement**:
  - Per-file progress indicators
  - Retry failed uploads individually
  - Pause/resume for large files (chunked upload)

---

## 📂 Project Structure

```
MDM/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── assets/         # Logo, images
│   │   ├── components/     # UI Components
│   │   │   ├── Header.jsx      # Navigation, search, actions
│   │   │   ├── DocumentGrid.jsx # Card grid layout
│   │   │   ├── DocumentCard.jsx # Individual file card
│   │   │   ├── DocumentTable.jsx # List/table view
│   │   │   ├── UploadModal.jsx  # File upload dialog
│   │   │   └── PreviewPanel.jsx # File preview sidebar
│   │   ├── App.jsx         # Main application logic
│   │   └── index.css       # Global styles & CSS variables
│   └── index.html
│
├── server/                 # Node.js Backend (Express)
│   ├── uploads/            # File storage directory
│   ├── db.json             # Metadata JSON database
│   └── index.js            # Express server & API routes
│
└── README.md
```

---

## 🎨 Features

- ✅ Multi-file upload with progress
- ✅ Grid & Table view modes
- ✅ Search documents
- ✅ Sort by date/size (asc/desc)
- ✅ Pagination (12 items per page)
- ✅ Inline preview (PDF, TXT, MD, JSON, HTML)
- ✅ Single & bulk download (ZIP)
- ✅ Single & bulk delete
- ✅ Responsive design (mobile-friendly)
- ✅ Pixel-art inspired UI theme

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Axios, React Icons |
| Backend | Node.js, Express, Multer, Archiver |
| Storage | Local filesystem + JSON metadata |
| Styling | Vanilla CSS with CSS Variables |
