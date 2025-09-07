import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.playerName = null;
    this.isLeader = false;
    this.eventListeners = new Map();
  }

  connect() {
    if (this.socket) return;
    this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGame(gameId, playerName, isLeader = false) {
    if (!this.socket) {
      this.connect();
    }
    if (this.socket && this.socket.connected && this.gameId === gameId) {
      return;
    }


    this.gameId = gameId;
    this.playerName = playerName;
    this.isLeader = isLeader;
    this.socket.emit('joinGame', { gameId, playerName, isLeader });
  }

  leaveGame() {
    if (this.socket && this.gameId) {
      this.socket.emit('leaveGame', this.gameId);
      this.gameId = null;
      this.playerName = null;
      this.isLeader = false;
    }
  }

  startGameRoom() {
    if (this.socket && this.gameId) {
      this.socket.emit('startGameRoom', this.gameId);
    }
  }

  startTimer() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('startTimer', this.gameId);
    }
  }

  restartTimer() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('restartTimer', this.gameId);
    }
  }

  correctAnswer() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('correctAnswer', this.gameId);
    }
  }

  incorrectAnswer() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('incorrectAnswer', this.gameId);
    }
  }

  bankMoney() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('bankMoney', this.gameId);
    }
  }

  nextQuestion() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('nextQuestion', this.gameId);
    }
  }

  startVoting() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('startVoting', this.gameId);
    }
  }

  voteForPlayer(targetId) {
    if (this.socket && this.gameId) {
      this.socket.emit('voteForPlayer', { gameId: this.gameId, targetId });
    }
  }

  endVoting() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('endVoting', this.gameId);
    }
  }

  eliminateSpecificPlayer(playerId) {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('eliminateSpecificPlayer', { gameId: this.gameId, playerId });
    }
  }

  startDuel() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('startDuel', this.gameId);
    }
  }

  startDuelQuestions() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('startDuelQuestions', this.gameId);
    }
  }

  duelAnswer(playerId, isCorrect) {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('duelAnswer', { gameId: this.gameId, playerId, isCorrect });
    }
  }

  nextDuelQuestion() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('nextDuelQuestion', this.gameId);
    }
  }

  endDuel() {
    if (this.socket && this.gameId && this.isLeader) {
      this.socket.emit('endDuel', this.gameId);
    }
  }

  getGameState() {
    if (this.socket && this.gameId) {
      this.socket.emit('getGameState', this.gameId);
    }
  }

  on(event, callback) {
    if (!this.socket) return;
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  offAll() {
    if (!this.socket) return;
    for (const [event, listeners] of this.eventListeners) {
      for (const callback of listeners) {
        this.socket.off(event, callback);
      }
    }
    this.eventListeners.clear();
  }

  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  isConnected() {
    return this.socket && this.socket.connected;
  }

  getPlayerInfo() {
    return {
      socketId: this.getSocketId(),
      gameId: this.gameId,
      playerName: this.playerName,
      isLeader: this.isLeader
    };
  }
}

const socketService = new SocketService();

export default socketService;
