const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Buat folder uploads jika belum ada
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB
    },
    fileFilter: (req, file, cb) => {
        // Blok file yang berpotensi berbahaya
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4', 'audio/mpeg', 'application/zip'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Jenis file tidak diizinkan'), false);
        }
    }
});

// Simpan informasi file (dalam produksi, gunakan database)
const fileDatabase = new Map();

// Routes
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
        }

        const fileInfo = {
            id: uuidv4(),
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadDate: new Date(),
            downloadCount: 0
        };

        fileDatabase.set(fileInfo.id, fileInfo);

        const fileUrl = `${req.protocol}://${req.get('host')}/file/${fileInfo.id}`;
        
        res.json({
            success: true,
            url: fileUrl,
            fileInfo: {
                originalName: fileInfo.originalName,
                size: fileInfo.size,
                mimetype: fileInfo.mimetype
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengunggah file' });
    }
});

app.get('/file/:fileId', (req, res) => {
    try {
        const fileId = req.params.fileId;
        const fileInfo = fileDatabase.get(fileId);

        if (!fileInfo) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        // Update download count
        fileInfo.downloadCount++;
        fileDatabase.set(fileId, fileInfo);

        const filePath = path.join(__dirname, 'uploads', fileInfo.filename);
        
        // Set header untuk download
        res.setHeader('Content-Disposition', `inline; filename="${fileInfo.originalName}"`);
        res.setHeader('Content-Type', fileInfo.mimetype);
        
        res.sendFile(filePath);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengunduh file' });
    }
});

app.get('/file/:fileId/info', (req, res) => {
    try {
        const fileId = req.params.fileId;
        const fileInfo = fileDatabase.get(fileId);

        if (!fileInfo) {
            return res.status(404).json({ error: 'File tidak ditemukan' });
        }

        res.json({
            originalName: fileInfo.originalName,
            size: fileInfo.size,
            mimetype: fileInfo.mimetype,
            uploadDate: fileInfo.uploadDate,
            downloadCount: fileInfo.downloadCount
        });
    } catch (error) {
        console.error('File info error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan saat mengambil informasi file' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Ukuran file terlalu besar. Maksimal 25MB.' });
        }
    }
    res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
