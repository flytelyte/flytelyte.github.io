const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'projects.json');

app.use(bodyParser.json());
app.use(express.static('.')); // Serve current directory static files

// API to save projects
app.post('/api/save', (req, res) => {
    const newData = req.body;
    
    // Basic validation
    if (!Array.isArray(newData)) {
        return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 4), 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return res.status(500).json({ success: false, message: 'Failed to save file' });
        }
        console.log('Projects saved successfully');
        res.json({ success: true, message: 'Saved successfully' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin GUI available at http://localhost:${PORT}/admin.html`);
});
