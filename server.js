const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
// Node.js 18+ has built-in fetch

const app = express();
const PORT = 3001;

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(express.json());

// Setup sessions directory
const SESSIONS_DIR = path.join(__dirname, 'data', 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Session helper functions
function generateSessionId() {
  return Date.now().toString();
}

function getSessionPath(sessionId) {
  return path.join(SESSIONS_DIR, `session_${sessionId}.json`);
}

// Session endpoints
app.post('/api/sessions', (req, res) => {
  try {
    const sessionData = req.body;
    const sessionId = sessionData.id || generateSessionId();
    
    const sessionInfo = {
      ...sessionData,
      id: sessionId,
      createdAt: sessionData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: sessionData.title || sessionData.problemStatement?.substring(0, 50) || 'Untitled Session'
    };

    fs.writeFileSync(getSessionPath(sessionId), JSON.stringify(sessionInfo, null, 2));
    res.json({ success: true, sessionId, message: 'Session saved successfully' });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.get('/api/sessions', (req, res) => {
  try {
    const files = fs.readdirSync(SESSIONS_DIR);
    const sessions = files
      .filter(file => file.startsWith('session_') && file.endsWith('.json'))
      .map(file => {
        const sessionData = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, file), 'utf8'));
        return {
          id: sessionData.id,
          title: sessionData.title,
          createdAt: sessionData.createdAt,
          updatedAt: sessionData.updatedAt,
          problemStatement: sessionData.problemStatement
        };
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.json(sessions);
  } catch (error) {
    console.error('Error loading sessions:', error);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

app.get('/api/sessions/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    const sessionPath = getSessionPath(sessionId);
    
    if (!fs.existsSync(sessionPath)) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    res.json(sessionData);
  } catch (error) {
    console.error('Error loading session:', error);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

app.delete('/api/sessions/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    const sessionPath = getSessionPath(sessionId);
    
    if (!fs.existsSync(sessionPath)) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    fs.unlinkSync(sessionPath);
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// Proxy endpoint for Anthropic API
app.post('/api/claude', async (req, res) => {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API Error:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Make sure to set ANTHROPIC_API_KEY environment variable');
});