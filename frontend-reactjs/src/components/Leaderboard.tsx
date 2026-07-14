import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Crown,
  ArrowUp,
  ArrowDown,
  UserPlus,
  Users,
  RotateCcw,
  Activity,
  Trash2,
  Plus,
  Minus,
  Search,
  Zap,
  Play,
  Square,
  Sparkles,
  TrendingUp,
  Award,
  Hash,
  RefreshCw
} from 'lucide-react';

interface LeaderboardEntry {
  player: string;
  score: number;
  prevPosition?: number;
}

const getWebSocketUrl = (): string => {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  if (typeof window !== 'undefined' && window.location) {
    // Check if we are running in local development mode
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'ws://localhost:3000';
    }
    // In production, use the current page's domain and protocol
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  
  return 'ws://localhost:3000';
};

const WS_URL = getWebSocketUrl();
const API_BASE_URL = WS_URL.replace(/^ws/, 'http');

// Helper to generate a reliable avatar gradient color based on username
const getAvatarGradient = (username: string) => {
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-emerald-400 to-teal-600',
    'from-blue-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-amber-400 to-orange-600',
    'from-fuchsia-500 to-violet-600',
    'from-cyan-400 to-blue-600'
  ];
  return colors[hash % colors.length];
};

const PositionChange: React.FC<{ currentPosition: number; prevPosition?: number }> = ({ currentPosition, prevPosition }) => {
  if (prevPosition === undefined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        New
      </span>
    );
  }

  const change = prevPosition - currentPosition;

  if (change === 0) {
    return <span className="text-slate-600 text-sm">●</span>;
  } else if (change > 0) {
    return (
      <span className="inline-flex items-center text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
        <ArrowUp className="w-3 h-3 mr-0.5" /> +{change}
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center text-rose-400 text-xs font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
        <ArrowDown className="w-3 h-3 mr-0.5" /> {change}
      </span>
    );
  }
};

const ScoreChart: React.FC<{ leaderboard: LeaderboardEntry[] }> = ({ leaderboard }) => {
  if (leaderboard.length === 0) return null;

  const maxScore = Math.max(...leaderboard.map(e => e.score), 1);
  const height = 140;
  const width = 500;
  const padding = 20;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  // Render a max of 12 entries in the chart to prevent clutter
  const chartData = leaderboard.slice(0, 12);
  const barWidth = chartData.length > 0 ? (chartWidth / chartData.length) * 0.75 : 0;
  const gap = chartData.length > 0 ? (chartWidth / chartData.length) * 0.25 : 0;

  return (
    <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="text-indigo-400 w-5 h-5" />
          <h3 className="text-lg font-semibold text-slate-200">Score Spread</h3>
        </div>
        <span className="text-xs text-slate-400">Top 12 Distribution</span>
      </div>
      <div className="relative w-full overflow-hidden flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-lg h-auto overflow-visible">
          {/* Grid Lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={padding + chartHeight / 2} x2={width - padding} y2={padding + chartHeight / 2} stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />

          {chartData.map((entry, index) => {
            const normalizedHeight = maxScore > 0 ? ((entry.score) / maxScore) * chartHeight : 0;
            const x = padding + index * (barWidth + gap);
            const y = height - padding - normalizedHeight;

            let fill = 'url(#gradient-default)';
            if (index === 0) fill = 'url(#gradient-first)';
            else if (index === 1) fill = 'url(#gradient-second)';
            else if (index === 2) fill = 'url(#gradient-third)';

            return (
              <g key={entry.player} className="group cursor-pointer">
                {/* Visual Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={normalizedHeight}
                  rx="3"
                  fill={fill}
                  className="transition-all duration-500 ease-out hover:brightness-125 hover:shadow-lg"
                />

                {/* Score tooltip above the bar on hover */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-indigo-300 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                >
                  {entry.score}
                </text>

                {/* Player Name below chart */}
                <text
                  x={x + barWidth / 2}
                  y={height - padding + 14}
                  textAnchor="middle"
                  className="fill-slate-400 text-[8px] font-medium pointer-events-none transition-colors group-hover:fill-slate-200"
                >
                  {entry.player.substring(0, 6)}
                </text>
              </g>
            );
          })}

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient-first" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="gradient-second" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="gradient-third" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="gradient-default" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerScore, setNewPlayerScore] = useState(1000);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [wsState, setWsState] = useState<number>(WebSocket.CLOSED);
  const [scoreStatus, setScoreStatus] = useState<Record<string, { change: 'up' | 'down'; timestamp: number }>>({});
  const [adjustStep, setAdjustStep] = useState<number>(100);
  const [isResetting, setIsResetting] = useState(false);

  const prevLeaderboardRef = useRef<LeaderboardEntry[]>([]);

  // Track WS connections and message broadcasts
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      setWsState(WebSocket.CONNECTING);

      ws.onopen = () => {
        console.log('WS Connected');
        setWsState(WebSocket.OPEN);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'leaderboard_update') {
          setLeaderboard((prevLeaderboard) => {
            const newLeaderboard = data.leaderboard.map((entry: LeaderboardEntry) => {
              const prevEntry = prevLeaderboard.find((e) => e.player === entry.player);
              return {
                ...entry,
                prevPosition: prevEntry ? prevLeaderboard.indexOf(prevEntry) : undefined,
              };
            });
            return newLeaderboard;
          });
        }
      };

      ws.onclose = () => {
        console.log('WS Closed, reconnecting...');
        setWsState(WebSocket.CLOSED);
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  // Fetch simulation state on mount
  useEffect(() => {
    const fetchSimStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/simulation/status`);
        const data = await res.json();
        setIsSimRunning(data.running);
      } catch (err) {
        console.error('Error fetching simulation status:', err);
      }
    };
    fetchSimStatus();
  }, []);

  // Detect score changes to trigger color glow updates
  useEffect(() => {
    if (prevLeaderboardRef.current.length > 0) {
      const newStatus: Record<string, { change: 'up' | 'down'; timestamp: number }> = { ...scoreStatus };
      let changed = false;

      leaderboard.forEach((entry) => {
        const prev = prevLeaderboardRef.current.find((p) => p.player === entry.player);
        if (prev && prev.score !== entry.score) {
          newStatus[entry.player] = {
            change: entry.score > prev.score ? 'up' : 'down',
            timestamp: Date.now(),
          };
          changed = true;
        }
      });

      if (changed) {
        setScoreStatus(newStatus);
      }
    }
    prevLeaderboardRef.current = leaderboard;
  }, [leaderboard]);

  const toggleSimulation = async () => {
    try {
      const endpoint = isSimRunning ? '/simulation/stop' : '/simulation/start';
      const res = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'POST' });
      const data = await res.json();
      setIsSimRunning(data.running);
    } catch (err) {
      console.error('Error toggling simulation:', err);
    }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/player/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: newPlayerName.trim(), score: Number(newPlayerScore) }),
      });
      setNewPlayerName('');
      setNewPlayerScore(1000);
    } catch (err) {
      console.error('Error adding player:', err);
    }
  };

  const removePlayer = async (name: string) => {
    try {
      await fetch(`${API_BASE_URL}/player/${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error removing player:', err);
    }
  };

  const adjustScore = async (player: string, amount: number, isIncrease: boolean) => {
    if (amount <= 0) return;
    try {
      const endpoint = isIncrease ? '/score/increase' : '/score/decrease';
      await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, score: amount }),
      });
    } catch (err) {
      console.error('Error adjusting score:', err);
    }
  };

  const resetScores = async () => {
    if (!window.confirm('Are you sure you want to reset all player scores to 1000?')) return;
    setIsResetting(true);
    try {
      await fetch(`${API_BASE_URL}/leaderboard/reset`, { method: 'POST' });
    } catch (err) {
      console.error('Error resetting leaderboard:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Get row highlight class matching score change direction
  const getRowHighlightClass = (player: string) => {
    const status = scoreStatus[player];
    if (!status || Date.now() - status.timestamp > 1200) return '';
    return status.change === 'up' ? 'animate-highlight-up' : 'animate-highlight-down';
  };

  // Calculate high level dashboard statistics
  const totalPlayers = leaderboard.length;
  const maxScore = totalPlayers > 0 ? leaderboard[0].score : 0;
  const totalPoints = leaderboard.reduce((sum, item) => sum + item.score, 0);
  const averageScore = totalPlayers > 0 ? Math.round(totalPoints / totalPlayers) : 0;
  const leaderLead = totalPlayers > 1 ? leaderboard[0].score - leaderboard[1].score : 0;

  // Filter leaderboard by search query
  const filteredLeaderboard = leaderboard.filter((item) =>
    item.player.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredLeaderboard.slice(0, 3);
  const restOfPlayers = filteredLeaderboard.slice(3);

  // Connection Indicator
  const renderConnectionBadge = () => {
    switch (wsState) {
      case WebSocket.OPEN:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 mr-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Live Connection
          </span>
        );
      case WebSocket.CONNECTING:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-2 h-2 mr-2 bg-amber-400 rounded-full animate-spin"></span>
            Connecting...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-2 h-2 mr-2 bg-rose-400 rounded-full"></span>
            Disconnected
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen pb-16 px-4 md:px-8 text-slate-100 max-w-7xl mx-auto">
      {/* Title & Connection Header */}
      <header className="flex flex-col md:flex-row justify-between items-center py-8 mb-8 border-b border-slate-800/60 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600/20 p-2.5 rounded-xl border border-indigo-500/30 shadow-indigo-500/10 shadow-md">
              <Trophy className="text-indigo-400 w-7 h-7" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              Redis Leaderboard
            </h1>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-1">
            Real-time player statuses powered by WebSockets and Redis sorted sets
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {renderConnectionBadge()}
          <button
            onClick={resetScores}
            disabled={isResetting || totalPlayers === 0}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700/80 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all"
          >
            <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Board</span>
          </button>
        </div>
      </header>

      {/* Main Grid: Info Cards, Charts, Podium */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Left Columns: Stats & Simulation controls */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* KPI metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Players</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-bold text-slate-100">{totalPlayers}</p>
              <span className="text-[10px] text-slate-500">In Redis active zset</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Leader Score</span>
                <Crown className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-bold text-amber-400">
                {totalPlayers > 0 ? leaderboard[0].score : 0}
              </p>
              <span className="text-[10px] text-slate-500 truncate block">
                {totalPlayers > 0 ? `Held by ${leaderboard[0].player}` : 'No entries'}
              </span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Point Pool</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-3xl font-bold text-emerald-400">{totalPoints}</p>
              <span className="text-[10px] text-slate-500">Summed score of all</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase">Average Score</span>
                <Award className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-3xl font-bold text-slate-100">{averageScore}</p>
              <span className="text-[10px] text-slate-500">
                {totalPlayers > 1 ? `Lead: +${leaderLead} pts` : 'No lead metric'}
              </span>
            </div>
            
          </div>

          {/* SVG Score spread chart */}
          <ScoreChart leaderboard={leaderboard} />
          
        </div>

        {/* Right Column: Simulation Controller Card */}
        <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/40 backdrop-blur-md rounded-2xl p-6 border border-slate-800/80 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 mb-4">
              <Zap className="w-5 h-5" />
              <h3 className="text-lg font-semibold text-slate-200">Simulation Controls</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Toggle the automated script that updates random player scores on the server every 2 seconds. Disable to interact manually.
            </p>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/50 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Simulation state</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isSimRunning ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                {isSimRunning ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isSimRunning 
                ? 'Scores are updating automatically. Faint row glows indicate changes.' 
                : 'Simulator paused. Use table buttons to increase/decrease player scores.'}
            </p>
          </div>

          <button
            onClick={toggleSimulation}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold flex items-center justify-center space-x-2 border transition-all duration-300 cursor-pointer ${
              isSimRunning
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isSimRunning ? (
              <>
                <Square className="w-4 h-4 fill-rose-400" />
                <span>Pause Auto-Scoring</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Auto-Scoring</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Visual Podium for Top 3 */}
      {filteredLeaderboard.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center space-x-2">
            <Sparkles className="text-amber-400 w-5 h-5 animate-pulse" />
            <span>Leaderboard Podium</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto px-4">
            
            {/* 2ND PLACE */}
            <div className="order-2 md:order-1 flex flex-col items-center">
              {topThree[1] ? (
                <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center text-center relative shadow-lg transition-transform hover:-translate-y-1 duration-300">
                  <div className="absolute top-3 left-4 text-xs font-bold text-slate-400 uppercase">#2 Silver</div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xl font-extrabold border-2 border-slate-300 shadow-md shadow-black/20 mb-4">
                    {topThree[1].player.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-slate-200 text-lg truncate max-w-[150px]">{topThree[1].player}</h3>
                  <p className="text-2xl font-black text-slate-300 mt-1">{topThree[1].score}</p>
                  <div className="mt-3">
                    <PositionChange currentPosition={1} prevPosition={topThree[1].prevPosition} />
                  </div>
                  
                  {/* Manual adjustment triggers */}
                  <div className="flex items-center space-x-2 mt-5">
                    <button
                      onClick={() => adjustScore(topThree[1].player, adjustStep, false)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700/60"
                      title={`Decrease by ${adjustStep}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Step {adjustStep}</span>
                    <button
                      onClick={() => adjustScore(topThree[1].player, adjustStep, true)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/60"
                      title={`Increase by ${adjustStep}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-slate-900/20 border border-slate-800/40 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-slate-600 h-52">
                  <span className="text-sm font-semibold">Empty Slot #2</span>
                </div>
              )}
              {/* Podium block */}
              <div className="w-32 bg-slate-800/40 h-8 rounded-b-xl border-x border-b border-slate-700/50 hidden md:block"></div>
            </div>

            {/* 1ST PLACE (Center) */}
            <div className="order-1 md:order-2 flex flex-col items-center">
              {topThree[0] ? (
                <div className="w-full bg-slate-900/70 border border-amber-500/30 rounded-2xl p-8 flex flex-col items-center text-center relative shadow-xl shadow-amber-500/5 transition-transform hover:-translate-y-2 duration-300 md:mb-4">
                  <div className="absolute -top-6 animate-float">
                    <Crown className="w-12 h-12 text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]" />
                  </div>
                  <div className="absolute top-4 left-4 text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" /> Champion
                  </div>
                  
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-black border-4 border-amber-400 shadow-lg shadow-amber-500/20 mt-4 mb-4">
                    {topThree[0].player.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-slate-100 text-xl truncate max-w-[180px]">{topThree[0].player}</h3>
                  <p className="text-3xl font-black text-amber-400 mt-1">{topThree[0].score}</p>
                  <div className="mt-3">
                    <PositionChange currentPosition={0} prevPosition={topThree[0].prevPosition} />
                  </div>

                  {/* Manual adjustment triggers */}
                  <div className="flex items-center space-x-2 mt-5">
                    <button
                      onClick={() => adjustScore(topThree[0].player, adjustStep, false)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700/60"
                      title={`Decrease by ${adjustStep}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-amber-500/80 font-bold uppercase">Step {adjustStep}</span>
                    <button
                      onClick={() => adjustScore(topThree[0].player, adjustStep, true)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/60"
                      title={`Increase by ${adjustStep}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-slate-900/20 border border-slate-800/40 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-slate-600 h-60 md:mb-4">
                  <Crown className="w-8 h-8 text-slate-700 mb-2" />
                  <span className="text-sm font-semibold">No Players Yet</span>
                </div>
              )}
              {/* Podium block */}
              <div className="w-36 bg-slate-800/60 h-12 rounded-b-xl border-x border-b border-slate-700/60 hidden md:block"></div>
            </div>

            {/* 3RD PLACE */}
            <div className="order-3 flex flex-col items-center">
              {topThree[2] ? (
                <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center text-center relative shadow-lg transition-transform hover:-translate-y-1 duration-300">
                  <div className="absolute top-3 left-4 text-xs font-bold text-amber-700 uppercase">#3 Bronze</div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-white text-xl font-extrabold border-2 border-amber-600 shadow-md shadow-black/20 mb-4">
                    {topThree[2].player.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="font-bold text-slate-200 text-lg truncate max-w-[150px]">{topThree[2].player}</h3>
                  <p className="text-2xl font-black text-amber-600 mt-1">{topThree[2].score}</p>
                  <div className="mt-3">
                    <PositionChange currentPosition={2} prevPosition={topThree[2].prevPosition} />
                  </div>

                  {/* Manual adjustment triggers */}
                  <div className="flex items-center space-x-2 mt-5">
                    <button
                      onClick={() => adjustScore(topThree[2].player, adjustStep, false)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700/60"
                      title={`Decrease by ${adjustStep}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">Step {adjustStep}</span>
                    <button
                      onClick={() => adjustScore(topThree[2].player, adjustStep, true)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700/60"
                      title={`Increase by ${adjustStep}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-slate-900/20 border border-slate-800/40 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-slate-600 h-52">
                  <span className="text-sm font-semibold">Empty Slot #3</span>
                </div>
              )}
              {/* Podium block */}
              <div className="w-32 bg-slate-800/40 h-6 rounded-b-xl border-x border-b border-slate-700/50 hidden md:block"></div>
            </div>

          </div>
        </section>
      )}

      {/* Main Table & Add Player Section */}
      <div className="bg-slate-900/30 backdrop-blur-md rounded-3xl border border-slate-850 p-6 md:p-8 shadow-xl">
        
        {/* Table Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-6 pb-6 border-b border-slate-800/50">
          
          {/* Left search */}
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-3.5 text-slate-500 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-all focus:ring-1 focus:ring-indigo-500/30"
            />
          </div>

          {/* Center: Step score control */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-start lg:justify-center">
            <span className="text-xs text-slate-450 uppercase tracking-wider font-semibold">Change Step:</span>
            <div className="inline-flex rounded-xl bg-slate-950 p-0.5 border border-slate-800/60">
              {[10, 50, 100, 500].map((step) => (
                <button
                  key={step}
                  onClick={() => setAdjustStep(step)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    adjustStep === step
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Inline Add Player */}
          <form onSubmit={addPlayer} className="flex items-center gap-2.5 w-full lg:w-auto">
            <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-1.5">
              <UserPlus className="text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="New Player..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="bg-transparent text-sm text-slate-200 focus:outline-none w-28 md:w-36"
              />
              <span className="text-slate-700">|</span>
              <input
                type="number"
                placeholder="Score"
                value={newPlayerScore}
                onChange={(e) => setNewPlayerScore(Number(e.target.value))}
                className="bg-transparent text-sm text-slate-200 focus:outline-none w-14 md:w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </form>
        </div>

        {/* The Leaderboard List Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] table-fixed">
            <thead>
              <tr className="text-slate-400 text-left border-b border-slate-800/30 text-xs font-semibold tracking-wider uppercase">
                <th className="py-4 px-4 w-20 text-center"><Hash className="w-4 h-4 inline" /></th>
                <th className="py-4 px-4 w-52">Player</th>
                <th className="py-4 px-4 w-44">Score Status</th>
                <th className="py-4 px-4 w-32 text-center">Movement</th>
                <th className="py-4 px-4 w-44 text-right">Quick Score Controls</th>
                <th className="py-4 px-4 w-20 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/25">
              {filteredLeaderboard.length > 0 ? (
                filteredLeaderboard.map((entry, index) => {
                  const relativeScorePercent = maxScore > 0 ? (entry.score / maxScore) * 100 : 0;
                  const rowClass = getRowHighlightClass(entry.player);

                  return (
                    <tr
                      key={entry.player}
                      className={`hover:bg-slate-800/10 transition-colors duration-250 ${rowClass}`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center justify-center font-bold text-sm text-slate-400 bg-slate-950/40 border border-slate-800/50 w-7 h-7 rounded-lg">
                          {index + 1}
                        </div>
                      </td>

                      {/* Username / Avatar */}
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarGradient(entry.player)} flex items-center justify-center text-white text-xs font-black shadow`}>
                            {entry.player.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-200 truncate">{entry.player}</span>
                        </div>
                      </td>

                      {/* Score Value & Progress Bar */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col space-y-1.5">
                          <div className="flex justify-between items-baseline">
                            <span className="font-extrabold text-slate-100 text-sm">{entry.score}</span>
                            <span className="text-[10px] text-slate-500">
                              {maxScore > 0 ? `${Math.round((entry.score / maxScore) * 100)}%` : '0%'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-950/60 rounded-full h-1.5 overflow-hidden border border-slate-800/20">
                            <div
                              style={{ width: `${Math.max(relativeScorePercent, 2)}%` }}
                              className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500 ease-out"
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Position change */}
                      <td className="py-4 px-4 text-center">
                        <PositionChange currentPosition={index} prevPosition={entry.prevPosition} />
                      </td>

                      {/* Plus/Minus triggers */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center space-x-2 bg-slate-950/40 border border-slate-800/30 p-1.5 rounded-xl">
                          <button
                            onClick={() => adjustScore(entry.player, adjustStep, false)}
                            className="p-1 rounded bg-slate-850 hover:bg-slate-850/80 text-rose-400 border border-slate-700/40 cursor-pointer"
                            title={`Decrease by ${adjustStep}`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] text-slate-400 font-bold px-1 select-none">
                            ±{adjustStep}
                          </span>
                          <button
                            onClick={() => adjustScore(entry.player, adjustStep, true)}
                            className="p-1 rounded bg-slate-850 hover:bg-slate-850/80 text-emerald-400 border border-slate-700/40 cursor-pointer"
                            title={`Increase by ${adjustStep}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => removePlayer(entry.player)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-all cursor-pointer"
                          title="Remove player"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    {searchQuery ? 'No players match your search filter.' : 'The leaderboard is currently empty.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;