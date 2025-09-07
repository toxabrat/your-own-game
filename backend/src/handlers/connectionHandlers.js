import { createGameRoom, getGameRoom, isGameStarted, markGameAsStarted, removePlayerFromGame, deleteGameRoom, gameRooms, idPlayersInRoom } from '../utils/gameManager.js';

export function setupConnectionHandlers(io) {
  return {
    joinGame: (socket, { gameId, playerName, isLeader = false }) => {
      let room = getGameRoom(gameId);
      if (!room) {
        room = createGameRoom(gameId);
      }
      
      if (isGameStarted(gameId) && !idPlayersInRoom.get(gameId).has(playerName)) {
        socket.emit('joinError', { message: 'Game already begin' });
        return;
      }
      try {
        socket.join(gameId);
        const existingPlayer = Array.from(room.players.values()).find(p => p.name === playerName);
        
        if (existingPlayer) {
          existingPlayer.id = socket.id;
          existingPlayer.isConnected = true;
        } else {
          room.addPlayer(socket.id, playerName, isLeader);
        }
        
        const gameState = room.getGameState();
        socket.emit('gameJoined', gameState);
        socket.to(gameId).emit('playerJoined', {
          player: gameState.players.find(p => p.id === socket.id)
        });
        io.to(gameId).emit('gameStateUpdate', gameState);
        
      } catch (error) {
        console.error('Error joining game:', error.message);
        socket.emit('joinError', { message: error.message });
      }
    },

    leaveGame: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room) {
        let playerName = "";
        if (room.players.has(socket.id)) {
          playerName = room.players.get(socket.id).name;
        }
        const gameState = room.removePlayer(socket.id);
        socket.leave(gameId);

        if (room.players.has(socket.id) && isGameStarted(gameId) && idPlayersInRoom.get(gameId).has(playerName)) {
          removePlayerFromGame(gameId, playerName);
        }
        io.to(gameId).emit('playerLeft', { playerId: socket.id });
        io.to(gameId).emit('gameStateUpdate', gameState);
        
        if (room.players.size === 0) {
          deleteGameRoom(gameId);
        }
      }
    },

    startGameRoom: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room && room.leader === socket.id) {
        markGameAsStarted(gameId, Array.from(room.players.values()));
        room.players.forEach(player => {
          if (!player.isLeader) {
            player.isActive = true;
          }
        });
        room.setReadyState();
        io.to(gameId).emit('gameRoomStart', room.getGameState());
      }
    },

    getGameState: (socket, gameId) => {
      const room = getGameRoom(gameId);
      if (room) {
        socket.emit('gameStateUpdate', room.getGameState());
      }
    },

    disconnect: (socket) => {
      for (const [gameId, room] of gameRooms) {
        if (room.players.has(socket.id)) {
          if (room.gameState === 'duel' || room.gameState === 'duel_ready') {
            const player = room.players.get(socket.id);
            if (player) {
              player.isConnected = false;
            }
            io.to(gameId).emit('gameStateUpdate', room.getGameState());
          } else {
            const gameState = room.removePlayer(socket.id);
            io.to(gameId).emit('playerLeft', { playerId: socket.id });
            io.to(gameId).emit('gameStateUpdate', gameState);
          }
          
          if (room.players.size === 0) {
            deleteGameRoom(gameId);
          }
          break;
        }
      }
    }
  };
}
