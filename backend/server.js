const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// GET Route: Fetch all materials
app.get('/api/materials', (req, res) => {
    // Execute the compiled C program with the SELECT command
    exec('./db SELECT', (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Database read failed' });
        }
        try {
            // The C program outputs a JSON-formatted string
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: 'Data parsing failed' });
        }
    });
});

// POST Route: Add a new material
app.post('/api/materials', (req, res) => {
    const { id, name, cost } = req.body;
    
    // Pass the parameters directly into the C executable
    const command = `./db INSERT ${id} "${name}" ${cost}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: 'Database write failed' });
        }
        res.json({ message: stdout.trim() });
    });
});

app.listen(3001, () => {
    console.log('Database Wrapper API running on http://localhost:3001');
});