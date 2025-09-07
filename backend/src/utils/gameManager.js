import { GameRoom } from '../models/GameRoom.js';

export const gameRooms = new Map();
export const startedGameRooms = new Set();
export const idPlayersInRoom = new Map();

export function createGameRoom(gameId) {
  const room = new GameRoom(gameId);
  gameRooms.set(gameId, room);
  return room;
}

export function getGameRoom(gameId) {
  return gameRooms.get(gameId);
}

export function deleteGameRoom(gameId) {
  gameRooms.delete(gameId);
  startedGameRooms.delete(gameId);
  idPlayersInRoom.delete(gameId);
}

export function isGameStarted(gameId) {
  return startedGameRooms.has(gameId);
}

export function markGameAsStarted(gameId, players) {
  startedGameRooms.add(gameId);
  const playersName = new Set(players.map(player => player.name));
  idPlayersInRoom.set(gameId, playersName);
}

export function removePlayerFromGame(gameId, playerName) {
  const playersSet = idPlayersInRoom.get(gameId);
  if (playersSet) {
    playersSet.delete(playerName);
  }
}



