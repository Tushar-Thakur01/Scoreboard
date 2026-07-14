import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import Redis from 'ioredis';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { startSimulation, stopSimulation, isSimulationRunning } from './simulation';
import { LeaderboardManager } from './LeaderboardManager';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// use REDIS_URL environment variable if available, otherwise use default
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const leaderboardManager = new LeaderboardManager(redis, wss);

app.use(cors());
app.use(express.json());

// Increase a player's score
app.post('/score/increase', async (req, res) => {
  const { player, score } = req.body;

  if (typeof player !== 'string' || typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    await leaderboardManager.increaseScore(player, score);
    res.json({ message: 'Score increased successfully' });
  } catch (error) {
    console.error('Error increasing score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Decrease a player's score
app.post('/score/decrease', async (req, res) => {
  const { player, score } = req.body;

  if (typeof player !== 'string' || typeof score !== 'number' || score < 0) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    await leaderboardManager.decreaseScore(player, score);
    res.json({ message: 'Score decreased successfully' });
  } catch (error) {
    console.error('Error decreasing score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top players
app.get('/leaderboard', async (req, res) => {
  const count = parseInt(req.query.count as string) || 100;

  try {
    const leaderboard = await leaderboardManager.getLeaderboard(count);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error retrieving leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the simulation
app.post('/simulation/start', async (req, res) => {
  try {
    await startSimulation(leaderboardManager);
    res.json({ status: 'running', running: true });
  } catch (error) {
    console.error('Error starting simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stop the simulation
app.post('/simulation/stop', (req, res) => {
  try {
    stopSimulation();
    res.json({ status: 'stopped', running: false });
  } catch (error) {
    console.error('Error stopping simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get simulation status
app.get('/simulation/status', (req, res) => {
  res.json({ running: isSimulationRunning() });
});

// Add player
app.post('/player/add', async (req, res) => {
  const { player, score } = req.body;
  if (typeof player !== 'string' || player.trim() === '') {
    return res.status(400).json({ error: 'Invalid player name' });
  }
  const initialScore = typeof score === 'number' && score >= 0 ? score : 1000;
  try {
    await leaderboardManager.addScore(player, initialScore);
    res.json({ message: `Player ${player} added successfully` });
  } catch (error) {
    console.error('Error adding player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete player
app.delete('/player/:name', async (req, res) => {
  const player = req.params.name;
  try {
    await leaderboardManager.removePlayer(player);
    res.json({ message: `Player ${player} removed successfully` });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset leaderboard
app.post('/leaderboard/reset', async (req, res) => {
  try {
    await leaderboardManager.resetLeaderboard();
    res.json({ message: 'Leaderboard reset successfully' });
  } catch (error) {
    console.error('Error resetting leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React static files in production if they exist
const frontendBuildPath = path.join(__dirname, '../../frontend-reactjs/build');
if (fs.existsSync(frontendBuildPath)) {
  console.log(`Serving static files from: ${frontendBuildPath}`);
  app.use(express.static(frontendBuildPath));
  
  // Catch-all route to serve index.html for client-side routing fallback
  app.get('*', (req, res, next) => {
    // Avoid matching API paths
    if (
      req.path.startsWith('/score') ||
      req.path.startsWith('/leaderboard') ||
      req.path.startsWith('/simulation') ||
      req.path.startsWith('/player')
    ) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startSimulation(leaderboardManager);
  console.log('Simulation started');
});

// Broadcast leaderboard every 2 seconds
setInterval(() => leaderboardManager.broadcastLeaderboard(), 2000);
