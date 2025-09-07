import fs from 'fs';
import path from 'path';

const questionsPath = path.join(process.cwd(), 'src', 'questions.json');
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

export class GameRoom {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = new Map(); 
    this.leader = null; 
    this.currentQuestionIndex = 0;
    this.currentScoreLevel = -1; 
    this.bank = 0; 
    this.totalBank = 0;
    this.isTimerRunning = false;
    this.timeLeft = 150;
    this.timerInterval = null;
    this.gameState = 'waiting';
    this.currentPlayerIndex = 0;
    this.votingStarted = false;
    this.votingEnded = false;
    this.votes = new Map();
    this.voteCounts = new Map();
    this.duelStarted = false;
    this.duelQuestionIndex = 0;
    this.duelScores = new Map(); 
    this.duelResults = new Map(); 
    this.duelPlayerOrder = [];
    this.currentDuelPlayerIndex = 0;
    this.questions = questions;
    this.scoreLevels = [
      { value: 1000 },
      { value: 2000 },
      { value: 5000 },
      { value: 10000 },
      { value: 20000 },
      { value: 30000 },
      { value: 40000 },
      { value: 50000 }
    ];
  }

  addPlayer(socketId, playerName, isLeader = false) {
    if (isLeader) {
      this.players.set(socketId, {
        id: socketId,
        name: playerName,
        isLeader: true,
        isActive: true,
        isConnected: true,
        currentAnswer: null,
        hasAnswered: false
      });
      this.leader = socketId;
      return this.getGameState();
    }

    const regularPlayers = Array.from(this.players.values()).filter(p => !p.isLeader);
    if (regularPlayers.length >= 8) {
      throw new Error('Limit 8 players');
    }

    this.players.set(socketId, {
      id: socketId,
      name: playerName,
      isLeader: false,
      isActive: true,
      isConnected: true,
      currentAnswer: null,
      hasAnswered: false
    });
    return this.getGameState();
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    if (this.leader === socketId && this.players.size > 0) {
      const firstPlayer = this.players.keys().next().value;
      this.leader = firstPlayer;
      this.players.get(firstPlayer).isLeader = true;
    }

    return this.getGameState();
  }

  getGameState() {
    const regularPlayers = Array.from(this.players.values()).filter(p => !p.isLeader && p.isConnected);
    const activePlayers = Array.from(this.players.values()).filter(p => !p.isLeader && p.isActive && p.isConnected);
    
    return {
      gameId: this.gameId,
      players: regularPlayers,
      allPlayers: Array.from(this.players.values()),
      activePlayers: activePlayers,
      leader: this.leader,
      currentQuestion: this.questions[this.currentQuestionIndex],
      currentQuestionIndex: this.currentQuestionIndex,
      currentScoreLevel: this.currentScoreLevel,
      currentPlayerIndex: this.currentPlayerIndex,
      bank: this.bank,
      totalBank: this.totalBank,
      isTimerRunning: this.isTimerRunning,
      timeLeft: this.timeLeft,
      gameState: this.gameState,
      scoreLevels: this.scoreLevels,
      votingStarted: this.votingStarted,
      votingEnded: this.votingEnded,
      votes: Array.from(this.votes.entries()),
      voteCounts: Array.from(this.voteCounts.entries()),
      duelStarted: this.duelStarted,
      duelQuestionIndex: this.duelQuestionIndex,
      duelScores: Array.from(this.duelScores.entries()),
      duelResults: Array.from(this.duelResults.entries()),
      duelPlayerOrder: this.duelPlayerOrder,
      currentDuelPlayerIndex: this.currentDuelPlayerIndex
    };
  }

  startTimer(io) {
    if (this.isTimerRunning) return;
    if (this.gameState === 'ready') {
      this.gameState = 'playing';
      this.currentScoreLevel = -1;
      this.currentPlayerIndex = 0;
    }
    this.isTimerRunning = true;
    this.timeLeft = 150;
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.handleIncorrectAnswer();
      }
      io.to(this.gameId).emit('timerUpdate', { timeLeft: this.timeLeft });
    }, 1000);
  }

  stopTimer() {
    this.isTimerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
  restartTimer(io) {
    this.stopTimer();
    this.timeLeft = 150;
    this.isTimerRunning = true;
    
    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.handleIncorrectAnswer();
      }
      
      io.to(this.gameId).emit('timerUpdate', { timeLeft: this.timeLeft });
    }, 1000);
  }

  nextPlayer() {
    const regularPlayers = Array.from(this.players.values()).filter(p => !p.isLeader && p.isActive);
    if (regularPlayers.length > 0) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % regularPlayers.length;
    }
  }

  handleCorrectAnswer() {
    if (this.currentScoreLevel === -1) {
      this.currentScoreLevel = 0;
    } else if (this.currentScoreLevel < this.scoreLevels.length - 1) {
      this.currentScoreLevel++;
    }
    this.players.forEach(player => {
      player.currentAnswer = null;
      player.hasAnswered = false;
    });
    this.nextPlayer();
  }

  handleIncorrectAnswer() {
    this.currentScoreLevel = -1;
    this.players.forEach(player => {
      player.currentAnswer = null;
      player.hasAnswered = false;
    });
    this.nextPlayer();
  }

  bankMoney() {
    if (this.currentScoreLevel >= 0) {
      const currentValue = this.scoreLevels[this.currentScoreLevel].value;
      this.bank += currentValue;
      this.totalBank += currentValue;
      this.currentScoreLevel = -1;
    }
  }

  nextQuestion() {
    this.currentQuestionIndex = (this.currentQuestionIndex + 1) % this.questions.length;
    this.players.forEach(player => {
      player.currentAnswer = null;
      player.hasAnswered = false;
    });
  }

  setReadyState() {
    this.gameState = 'ready';
    this.isTimerRunning = false;
    this.timeLeft = 150;
  }

  startVoting() {
    this.gameState = 'voting';
    this.votingStarted = true;
    this.votingEnded = false;
    this.votes.clear();
    this.voteCounts.clear();
    this.stopTimer();
    this.timeLeft = 150;
    this.players.forEach((player, socketId) => {
      if (!player.isLeader) {
        this.voteCounts.set(socketId, 0);
      }
    });
  }

  voteForPlayer(voterId, targetId) {
    const voter = this.players.get(voterId);
    if (!voter || voter.isLeader || voterId === targetId) {
      return false;
    }
    const target = this.players.get(targetId);
    if (!target || target.isLeader) {
      return false;
    }
    if (this.votes.has(voterId)) {
      return false;
    }

    this.votes.set(voterId, targetId);
    const currentCount = this.voteCounts.get(targetId) || 0;
    this.voteCounts.set(targetId, currentCount + 1);
    return true;
  }

  endVoting() {
    this.gameState = 'voting_results';
    this.votingEnded = true;
  }

  eliminateSpecificPlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player || player.isLeader) {
      return null;
    }
    player.isActive = false;
    
    this.setReadyState();
    this.votingStarted = false;
    this.votingEnded = false;
    this.votes.clear();
    this.voteCounts.clear();
    this.bank = 0;
    
    return player;
  }

  startDuel() {
    const regularPlayers = Array.from(this.players.values()).filter(p => !p.isLeader && p.isActive);
    if (regularPlayers.length !== 2) {
      return false;
    }
    this.gameState = 'duel_ready';
    this.duelStarted = false;
    this.duelQuestionIndex = 0;
    this.duelScores.clear();
    this.duelResults.clear();
    this.duelPlayerOrder = [];
    this.currentDuelPlayerIndex = 0;
    this.duelPlayerOrder = regularPlayers.map(p => p.id);
    regularPlayers.forEach(player => {
      this.duelScores.set(player.id, 0);
      this.duelResults.set(player.id, []);
    });

    return true;
  }

  startDuelQuestions() {
    if (this.gameState !== 'duel_ready') {
      return false;
    }
    this.gameState = 'duel';
    this.duelStarted = true;
    return true;
  }

  handleDuelAnswer(playerId, isCorrect) {
    if (this.gameState !== 'duel') {
      return false;
    }

    const currentPlayerId = this.duelPlayerOrder[this.currentDuelPlayerIndex];
    if (playerId !== currentPlayerId) {
      return false;
    }

    const currentScore = this.duelScores.get(playerId) || 0;

    if (isCorrect) {
      this.duelScores.set(playerId, currentScore + 1);
    }

    const currentResults = this.duelResults.get(playerId) || [];
    const newResults = [...currentResults, isCorrect].slice(-5);
    this.duelResults.set(playerId, newResults);
    this.currentDuelPlayerIndex = (this.currentDuelPlayerIndex + 1) % this.duelPlayerOrder.length;

    return true;
  }

  nextDuelQuestion() {
    if (this.gameState !== 'duel') {
      return false;
    }

    this.duelQuestionIndex++;
    this.currentQuestionIndex = (this.currentQuestionIndex + 1) % this.questions.length;
    return true;
  }

  endDuel() {
    if (this.gameState !== 'duel') {
      return null;
    }
    let maxScore = 0;
    let winner = null;

    for (const [playerId, score] of this.duelScores) {
      if (score > maxScore) {
        maxScore = score;
        winner = this.players.get(playerId);
      }
    }

    if (!winner && this.duelPlayerOrder.length > 0) {
      winner = this.players.get(this.duelPlayerOrder[0]);
    }

    this.duelStarted = false;
    this.duelScores.clear();
    this.duelResults.clear();
    this.duelPlayerOrder = [];
    this.currentDuelPlayerIndex = 0;
    return winner;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex];
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}



