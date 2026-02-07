const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Ensure db file exists
const DB_FILE = path.join(__dirname, 'db.json');
const initializeDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ documents: [] }, null, 2));
  }
};
initializeDB();

// Multer file filter (rejects images, allows docs)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|html|htm|xls|xlsx|rtf|csv|json/;

  if (file.mimetype.startsWith('image/')) {
    return cb(new Error('Images are not allowed'), false);
  }

  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    return cb(null, true);
  }
  cb(new Error('File type not allowed'), false);
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage, fileFilter });

// Helper to read/write DB
const readDB = () => {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (error) {
    return { documents: [] };
  }
};

const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// GET /documents - List with Search, Sort, Pagination
app.get('/documents', (req, res) => {
  try {
    const { page = 1, pageSize = 10, sortBy = 'date', sortOrder = 'desc', q = '' } = req.query;
    const db = readDB();
    let docs = db.documents;

    if (q) {
      docs = docs.filter(doc => doc.title.toLowerCase().includes(q.toLowerCase()));
    }

    docs.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'size') {
        valA = a.size;
        valB = b.size;
      } else {
        valA = new Date(a.uploadDate).getTime();
        valB = new Date(b.uploadDate).getTime();
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    const total = docs.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + Number(pageSize), total);
    const paginatedDocs = docs.slice(startIndex, endIndex);

    res.json({ documents: paginatedDocs, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching documents' });
  }
});

// POST /documents - Upload Multiple
app.post('/documents', (req, res) => {
  upload.array('files')(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const db = readDB();
      const newDocs = req.files.map(file => ({
        id: path.parse(file.filename).name,
        title: file.originalname,
        filename: file.filename,
        size: file.size,
        uploadDate: new Date().toISOString(),
        mimetype: file.mimetype
      }));

      db.documents.push(...newDocs);
      writeDB(db);

      res.status(201).json({ message: 'Upload successful', documents: newDocs });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error during upload' });
    }
  });
});

// GET /documents/:id/view - Inline view (for preview, no download)
app.get('/documents/:id/view', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const doc = db.documents.find(d => d.id === id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(UPLOADS_DIR, doc.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File on disk not found' });
    }

    // Get file extension to determine correct mimetype for viewing
    const ext = path.extname(doc.title).toLowerCase();

    // Map extensions to mimetypes that browsers can display inline
    const viewMimetypes = {
      '.md': 'text/plain; charset=utf-8',
      '.txt': 'text/plain; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.csv': 'text/plain; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.htm': 'text/html; charset=utf-8',
      '.xml': 'text/xml; charset=utf-8',
      '.pdf': 'application/pdf',
      '.rtf': 'text/plain; charset=utf-8'
    };

    // Use mapped mimetype or fall back to stored mimetype
    const contentType = viewMimetypes[ext] || doc.mimetype || 'application/octet-stream';

    // Inline display (no attachment)
    res.setHeader('Content-Disposition', `inline; filename="${doc.title}"`);
    res.setHeader('Content-Type', contentType);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('Streaming error:', err);
      res.end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during view' });
  }
});

// GET /documents/:id/download - Streaming Download (attachment)
app.get('/documents/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const doc = db.documents.find(d => d.id === id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(UPLOADS_DIR, doc.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File on disk not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${doc.title}"`);
    res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (err) => {
      console.error('Streaming error:', err);
      res.end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during download' });
  }
});

// POST /documents/download-zip - Bulk Download
app.post('/documents/download-zip', (req, res) => {
  try {
    const { docIds } = req.body;
    if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
      return res.status(400).json({ error: 'No document IDs provided' });
    }

    const db = readDB();
    const docsToZip = db.documents.filter(doc => docIds.includes(doc.id));

    if (docsToZip.length === 0) {
      return res.status(404).json({ error: 'No valid documents found for IDs' });
    }

    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="documents.zip"');

    archive.pipe(res);

    docsToZip.forEach(doc => {
      const filePath = path.join(UPLOADS_DIR, doc.filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: doc.title });
      }
    });

    archive.finalize();

    archive.on('error', function (err) {
      console.error('Archiver error:', err);
      res.end();
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during bulk download' });
  }
});

// DELETE /documents/:id - Delete single document
app.delete('/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = readDB();
    const docIndex = db.documents.findIndex(d => d.id === id);

    if (docIndex === -1) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = db.documents[docIndex];
    const filePath = path.join(UPLOADS_DIR, doc.filename);

    // Remove from database
    db.documents.splice(docIndex, 1);
    writeDB(db);

    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Document deleted successfully', id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during delete' });
  }
});

// POST /documents/delete-bulk - Delete multiple documents
app.post('/documents/delete-bulk', (req, res) => {
  try {
    const { docIds } = req.body;
    if (!docIds || !Array.isArray(docIds) || docIds.length === 0) {
      return res.status(400).json({ error: 'No document IDs provided' });
    }

    const db = readDB();
    const deletedIds = [];

    docIds.forEach(id => {
      const docIndex = db.documents.findIndex(d => d.id === id);
      if (docIndex !== -1) {
        const doc = db.documents[docIndex];
        const filePath = path.join(UPLOADS_DIR, doc.filename);

        // Remove from database
        db.documents.splice(docIndex, 1);

        // Delete file from disk
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        deletedIds.push(id);
      }
    });

    writeDB(db);

    res.json({ message: `Deleted ${deletedIds.length} documents`, deletedIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during bulk delete' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
