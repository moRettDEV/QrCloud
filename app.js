const express = require('express');
const qrcode = require('qrcode');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

app.post('/upload', upload.array('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        res.status(400).send('No files uploaded.');
        return;
    }

    const qrDataArray = [];

    for (const file of req.files) {
        const filename = file.filename;
        const qrData = `${req.protocol}://${req.get('host')}/download/${filename}`;
        qrDataArray.push({ qrData });
    }

    res.json(qrDataArray);
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = `uploads/${filename}`;

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found.');
    }
});

app.get('/list', (req, res) => {
    fs.readdir('uploads', (err, files) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.json({ files });
    });
});

app.get('/generate-qr/:filename', (req, res) => {
    const filename = req.params.filename;
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

app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = `uploads/${filename}`;

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.post('/delete-selected', async (req, res) => {
    const selectedFilesArray = req.body;

    if (!selectedFilesArray || selectedFilesArray.length === 0) {
        res.json({ success: false });
        return;
    }

    let success = true;
    for (const filename of selectedFilesArray) {
        const filePath = `uploads/${filename}`;
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`File "${filename}" deleted successfully.`);
            } catch (err) {
                console.error(`Error deleting file "${filename}":`, err);
                success = false;
            }
        } else {
            console.error(`File "${filename}" not found.`);
            success = false;
        }
    }

    res.json({ success });
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
