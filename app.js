const express = require('express');
const qrcode = require('qrcode');
const fs = require('fs');
const multer = require('multer');
const app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        res.status(400).send('No file uploaded.');
        return;
    }

    const file = req.file;
    const filename = file.filename;
    const qrData = `${req.protocol}://${req.get('host')}/download/${filename}`;

    qrcode.toDataURL(qrData, (err, qrDataURL) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.json({ qrDataURL });
    });
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = `uploads/${filename}`;

    // Проверка существования файла перед отправкой
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
