import { LeaderboardManager } from './LeaderboardManager';

const players = [
  'Ronaldo', 'Messi', 'Neymar', 'Mbappe', 'Haaland',
  'De Bruyne', 'Mohamed Salah', 'Benzema', 'Modric', 'Harry Kane'
];

let simulationInterval: NodeJS.Timeout | null = null;
let activeLeaderboardManager: LeaderboardManager | null = null;

function getRandomPlayer(): string {
  return players[Math.floor(Math.random() * players.length)];
}

function getRandomScore(): number {
  // Generate a score between 1 and 500 for more significant changes
  return Math.floor(Math.random() * 500) + 1;
}

async function updateRandomScore() {
  if (!activeLeaderboardManager) return;
  const player = getRandomPlayer();
  const scoreChange = getRandomScore();
  const isIncrease = Math.random() < 0.5;

  try {
    if (isIncrease) {
      await activeLeaderboardManager.increaseScore(player, scoreChange);
      console.log(`Increased score for ${player}: +${scoreChange}`);
    } else {
      await activeLeaderboardManager.decreaseScore(player, scoreChange);
      console.log(`Decreased score for ${player}: -${scoreChange}`);
    }
  } catch (error) {
    console.error('Error updating score:', error);
  }
}

async function startSimulation(leaderboardManager: LeaderboardManager) {
  activeLeaderboardManager = leaderboardManager;

  // Only initialize players if the leaderboard is empty
  const currentLeaderboard = await leaderboardManager.getLeaderboard(1);
  if (currentLeaderboard.length === 0) {
    await leaderboardManager.initializePlayers(players);
  }

  if (!simulationInterval) {
    simulationInterval = setInterval(() => updateRandomScore(), 2000);
    console.log('Simulation active');
  }
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
    console.log('Simulation stopped');
  }
}

function isSimulationRunning(): boolean {
  return simulationInterval !== null;
}

export { startSimulation, stopSimulation, isSimulationRunning };
