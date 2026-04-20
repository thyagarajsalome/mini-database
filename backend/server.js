const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// Determine the correct command based on your OS (Windows uses db.exe)
const dbCommand = process.platform === 'win32' ? 'db.exe' : './db';

// GET Route: Fetch all materials
app.get('/api/materials', (req, res) => {
    exec(`${dbCommand} SELECT`, (error, stdout, stderr) => {
        if (error) {
            console.error("Execution Error:", error);
            return res.status(500).json({ error: 'Database read failed' });
        }
        try {
            const data = JSON.parse(stdout);
            res.json(data);
        } catch (e) {
            console.error("Parse Error:", e, stdout);
            res.status(500).json({ error: 'Data parsing failed' });
        }
    });
});

// POST Route: Add a new material
app.post('/api/materials', (req, res) => {
    const { id, name, cost } = req.body;
    
    const command = `${dbCommand} INSERT ${id} "${name}" ${cost}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("Execution Error:", error);
            return res.status(500).json({ error: 'Database write failed' });
        }
        res.json({ message: stdout.trim() });
    });
});

// DELETE Route: Remove a material
app.delete('/api/materials/:id', (req, res) => {
    const command = `${dbCommand} DELETE ${req.params.id}`;
    exec(command, (error, stdout) => {
        if (error) return res.status(500).json({ error: 'Failed to delete' });
        res.json({ message: stdout.trim() });
    });
});

// PUT Route: Update a material
app.put('/api/materials/:id', (req, res) => {
    const { name, cost } = req.body;
    const command = `${dbCommand} UPDATE ${req.params.id} "${name}" ${cost}`;
    exec(command, (error, stdout) => {
        if (error) return res.status(500).json({ error: 'Failed to update' });
        res.json({ message: stdout.trim() });
    });
});

app.listen(3001, () => {
    console.log('Database Wrapper API running on http://localhost:3001');
});