import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'database.json');

// Ensure db exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ users: [], scores: [] }, null, 2));
}

const getDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

app.post('/api/register', (req, res) => {
  const { username, password, firstName, lastName } = req.body;
  if (!username || !password || !firstName || !lastName) return res.status(400).json({ error: 'Todos los campos son requeridos' });
  
  const db = getDb();
  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'El usuario ya existe' });
  }

  db.users.push({ username, password, firstName, lastName, createdAt: new Date().toISOString() });
  saveDb(db);
  res.json({ success: true, username, firstName, lastName });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const user = db.users.find(u => u.username === username && u.password === password);
  
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
  res.json({ success: true, username: user.username });
});

app.post('/api/scores', (req, res) => {
  const { username, gameId, score, level } = req.body;
  if (!username) return res.status(400).json({ error: 'Username requerido' });

  // Cap score at 1000 per game as requested
  const cappedScore = Math.min(score, 1000);

  const db = getDb();
  db.scores.push({ username, gameId, score: cappedScore, level, date: new Date().toISOString() });
  saveDb(db);
  res.json({ success: true });
});

app.get('/api/scores', (req, res) => {
  const db = getDb();
  // Return top 50 scores or all scores
  res.json(db.scores.sort((a,b) => b.score - a.score || new Date(b.date) - new Date(a.date)).slice(0, 50));
});

// New endpoint to calculate leaderboard by summing maximum scores per game
app.get('/api/leaderboard', (req, res) => {
  const db = getDb();
  
  // Calculate max score per game for each user
  const userScores = {};
  
  db.scores.forEach(s => {
    if (!userScores[s.username]) {
      userScores[s.username] = {};
    }
    const currentMax = userScores[s.username][s.gameId] || 0;
    if (s.score > currentMax) {
      userScores[s.username][s.gameId] = s.score;
    }
  });

  const leaderboard = Object.keys(userScores).map(username => {
    const user = db.users.find(u => u.username === username);
    const games = userScores[username];
    const totalScore = Object.values(games).reduce((sum, score) => sum + score, 0);
    const totalGames = Object.keys(games).length;
    
    return {
      username,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      totalScore,
      totalGames,
      lastPlayed: new Date().toISOString() // Or get from scores if needed
    };
  });

  leaderboard.sort((a, b) => b.totalScore - a.totalScore);
  
  res.json(leaderboard.slice(0, 50));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
