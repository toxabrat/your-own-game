import { getGameRoom, isGameStarted, idPlayersInRoom, removePlayerFromGame } from '../utils/gameManager.js';

export function setupGameHandlers(io) {
  return {
    startTimer: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.startTimer(io);
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    restartTimer: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.restartTimer(io);
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    resetPlayersActivity: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.players.forEach(player => {
          if (!player.isLeader) {
            player.isActive = true;
          }
        });
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    correctAnswer: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.handleCorrectAnswer();
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    incorrectAnswer: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.handleIncorrectAnswer();
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    bankMoney: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.bankMoney();
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    nextQuestion: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.nextQuestion();
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    startVoting: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.startVoting();
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    voteForPlayer: (socket, { gameId, targetId }) => {
      const room = getGameRoom(gameId);
      if (room) {
        const success = room.voteForPlayer(socket.id, targetId);
        if (success) {
          io.to(gameId).emit('gameStateUpdate', room.getGameState());
        }
      }
    },

    endVoting: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        room.endVoting();
        io.to(gameId).emit('gameStateUpdate', room.getGameState());
      }
    },

    eliminateSpecificPlayer: (socket, { gameId, playerId }) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        const eliminatedPlayer = room.eliminateSpecificPlayer(playerId);
        if (eliminatedPlayer) {
          let playerName = room.players.get(playerId).name;
          if (isGameStarted(gameId) && idPlayersInRoom.get(gameId).has(playerName)) {
            removePlayerFromGame(gameId, playerName);
          }
          io.to(gameId).emit('playerEliminated', { player: eliminatedPlayer });
          io.to(gameId).emit('gameStateUpdate', room.getGameState());
        }
      }
    }
  };
}
