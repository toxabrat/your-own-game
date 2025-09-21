import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './utils/config.js';
import { setupConnectionHandlers } from './handlers/connectionHandlers.js';
import { setupGameHandlers } from './handlers/gameHandlers.js';
import { setupDuelHandlers } from './handlers/duelHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

const connectionHandlers = setupConnectionHandlers(io);
const gameHandlers = setupGameHandlers(io);
const duelHandlers = setupDuelHandlers(io);

io.on('connection', (socket) => {
  socket.on('joinGame', (data) => connectionHandlers.joinGame(socket, data));
  socket.on('leaveGame', (gameId) => connectionHandlers.leaveGame(socket, gameId));
  socket.on('startGameRoom', (gameId) => connectionHandlers.startGameRoom(socket, gameId));
  socket.on('getGameState', (gameId) => connectionHandlers.getGameState(socket, gameId));
  socket.on('disconnect', () => connectionHandlers.disconnect(socket));
  socket.on('startTimer', (gameId) => gameHandlers.startTimer(socket, gameId));
  socket.on('restartTimer', (gameId) => gameHandlers.restartTimer(socket, gameId));
  socket.on('resetPlayersActivity', (gameId) => gameHandlers.resetPlayersActivity(socket, gameId));
  socket.on('correctAnswer', (gameId) => gameHandlers.correctAnswer(socket, gameId));
  socket.on('incorrectAnswer', (gameId) => gameHandlers.incorrectAnswer(socket, gameId));
  socket.on('bankMoney', (gameId) => gameHandlers.bankMoney(socket, gameId));
  socket.on('nextQuestion', (gameId) => gameHandlers.nextQuestion(socket, gameId));
  socket.on('startVoting', (gameId) => gameHandlers.startVoting(socket, gameId));
  socket.on('voteForPlayer', (data) => gameHandlers.voteForPlayer(socket, data));
  socket.on('endVoting', (gameId) => gameHandlers.endVoting(socket, gameId));
  socket.on('eliminateSpecificPlayer', (data) => gameHandlers.eliminateSpecificPlayer(socket, data));
  socket.on('startDuel', (gameId) => duelHandlers.startDuel(socket, gameId));
  socket.on('startDuelQuestions', (gameId) => duelHandlers.startDuelQuestions(socket, gameId));
  socket.on('duelAnswer', (data) => duelHandlers.duelAnswer(socket, data));
  socket.on('nextDuelQuestion', (gameId) => duelHandlers.nextDuelQuestion(socket, gameId));
  socket.on('endDuel', (gameId) => duelHandlers.endDuel(socket, gameId));
});

server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
  console.log(`Frontend URL: ${config.FRONTEND_URL}`);
});