import { createGameRoom, getGameRoom, isGameStarted, markGameAsStarted, removePlayerFromGame, deleteGameRoom, gameRooms, idPlayersInRoom } from '../utils/gameManager.js';

export function setupConnectionHandlers(io) {
  return {
    joinGame: (socket, { gameId, playerName, isLeader = false }) => {
      let room = getGameRoom(gameId);

      if (!room && !isLeader) {
        socket.emit('joinError', { message: 'Game room does not exist' });
        return;
      }
      
      if (!room && isLeader) {
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
          room.cancelDisconnectTimer(socket.id);
          if (isLeader && existingPlayer.isLeader) {
            room.leader = socket.id;
          }
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
          const player = room.players.get(socket.id);
          playerName = player.name;
          player.isConnected = false;
        }
        socket.leave(gameId);

        if (room.players.has(socket.id) && isGameStarted(gameId) && idPlayersInRoom.get(gameId).has(playerName)) {
          removePlayerFromGame(gameId, playerName);
        }
        io.to(gameId).emit('playerLeft', { playerId: socket.id });
        
        const gameState = room.getGameState();
        io.to(gameId).emit('gameStateUpdate', gameState);
        
        const connectedPlayers = Array.from(room.players.values()).filter(p => p.isConnected);
        if (connectedPlayers.length === 0) {
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
          const player = room.players.get(socket.id);
          if (player) {
            player.isConnected = false;
            room.setDisconnectTimer(socket.id, () => {
              if (room.players.has(socket.id) && !room.players.get(socket.id).isConnected) {
                room.removePlayer(socket.id);
                io.to(gameId).emit('playerLeft', { playerId: socket.id });
                
                const gameState = room.getGameState();
                io.to(gameId).emit('gameStateUpdate', gameState);
                if (room.players.size === 0) {
                  deleteGameRoom(gameId);
                }
              }
            }, 5000);
          }
          
          const gameState = room.getGameState();
          io.to(gameId).emit('gameStateUpdate', gameState);
          break;
        }
      }
    }
  };
}
