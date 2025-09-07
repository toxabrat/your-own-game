import { getGameRoom } from '../utils/gameManager.js';

export function setupDuelHandlers(io) {
  return {
    startDuel: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        const success = room.startDuel();
        if (success) {
          io.to(gameId).emit('duelStarted', { gameId });
          io.to(gameId).emit('gameStateUpdate', room.getGameState());
        }
      }
    },

    startDuelQuestions: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        const success = room.startDuelQuestions();
        if (success) {
          io.to(gameId).emit('gameStateUpdate', room.getGameState());
        }
      }
    },

    duelAnswer: (socket, { gameId, playerId, isCorrect }) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        const success = room.handleDuelAnswer(playerId, isCorrect);
        if (success) {
          io.to(gameId).emit('gameStateUpdate', room.getGameState());
        }
      }
    },

    nextDuelQuestion: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        const success = room.nextDuelQuestion();
        if (success) {
          io.to(gameId).emit('gameStateUpdate', room.getGameState());
        }
      }
    },

    endDuel: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        const winner = room.endDuel();
        if (winner) {
          io.to(gameId).emit('duelEnded', { winner, totalBank: room.totalBank });
          io.to(gameId).emit('gameStateUpdate', room.getGameState());
          setTimeout(() => {
            room.gameState = 'playing';
            io.to(gameId).emit('gameStateUpdate', room.getGameState());
          }, 2000);
        }
      }
    }
  };
}



