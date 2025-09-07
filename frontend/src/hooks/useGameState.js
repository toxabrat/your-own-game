import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';

export const useGameState = (gameId, playerName, isLeader = false) => {
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(() => socketService.isConnected());
  const [error, setError] = useState(null);

  const connectToGame = useCallback(() => {
    if (!gameId || !playerName) return;

    try {
      socketService.joinGame(gameId, playerName, isLeader);
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting to game:', error);
      setError('Error connecting to game');
    }
  }, [gameId, playerName, isLeader]);

  const disconnectFromGame = useCallback(() => {
    socketService.leaveGame();
    setIsConnected(false);
    setGameState(null);
  }, []);

  const startGameRoom = useCallback(() => {
    if (gameId && playerName) {
      socketService.startGameRoom();
    }
  }, [gameId, playerName]);

  const startTimer = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.startTimer();
    }
  }, [isLeader, isConnected]);

  const restartTimer = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.restartTimer();
    }
  }, [isLeader, isConnected]);

  const correctAnswer = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.correctAnswer();
    }
  }, [isLeader, isConnected]);

  const incorrectAnswer = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.incorrectAnswer();
    }
  }, [isLeader, isConnected]);

  const bankMoney = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.bankMoney();
    }
  }, [isLeader, isConnected]);

  const nextQuestion = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.nextQuestion();
    }
  }, [isLeader, isConnected]);

  const startVoting = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.startVoting();
    }
  }, [isLeader, isConnected]);

  const voteForPlayer = useCallback((targetId) => {
    if (isConnected) {
      socketService.voteForPlayer(targetId);
    }
  }, [isConnected]);

  const endVoting = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.endVoting();
    }
  }, [isLeader, isConnected]);

  const eliminateSpecificPlayer = useCallback((playerId) => {
    if (isLeader && isConnected) {
      socketService.eliminateSpecificPlayer(playerId);
    }
  }, [isLeader, isConnected]);

  const startDuel = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.startDuel();
    }
  }, [isLeader, isConnected]);

  const startDuelQuestions = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.startDuelQuestions();
    }
  }, [isLeader, isConnected]);

  const duelAnswer = useCallback((playerId, isCorrect) => {
    if (isLeader && isConnected) {
      socketService.duelAnswer(playerId, isCorrect);
    }
  }, [isLeader, isConnected]);

  const nextDuelQuestion = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.nextDuelQuestion();
    }
  }, [isLeader, isConnected]);

  const endDuel = useCallback(() => {
    if (isLeader && isConnected) {
      socketService.endDuel();
    }
  }, [isLeader, isConnected]);

  const getGameState = useCallback(() => {
    if (isConnected) {
      socketService.getGameState();
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    const handleGameJoined = (state) => {
      setGameState(state);
      setError(null);
    };

    const handleGameStateUpdate = (state) => {
      setGameState(state);
    };

    const handlePlayerJoined = (data) => {
      getGameState();
    };

    const handlePlayerLeft = (data) => {
      getGameState();
    };

    const handlePlayerEliminated = (data) => {
      getGameState();
    };

    const handleDuelEnded = (data) => {
      getGameState();
    };

    const handleTimerUpdate = (data) => {
      setGameState(prev => {
        if (prev) {
          return {
            ...prev,
            timeLeft: data.timeLeft,
            isTimerRunning: data.timeLeft > 0
          };
        }
        return prev;
      });
    };

    const handleConnectError = (error) => {
      console.error('Connection error:', error);
      setError('Error conection to game');
      setIsConnected(false);
    };

    const handleJoinError = (error) => {
      setError(error.message || 'Error conection to game');
      setIsConnected(false);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setGameState(null);
    };

    const handleGameRoomStart = (state) => {  
      setGameState(state);
      setError(null);
    }

    socketService.on('gameJoined', handleGameJoined);
    socketService.on('gameStateUpdate', handleGameStateUpdate);
    socketService.on('playerJoined', handlePlayerJoined);
    socketService.on('playerLeft', handlePlayerLeft);
    socketService.on('playerEliminated', handlePlayerEliminated);
    socketService.on('duelEnded', handleDuelEnded);
    socketService.on('timerUpdate', handleTimerUpdate);
    socketService.on('connect_error', handleConnectError);
    socketService.on('joinError', handleJoinError);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('gameRoomStart', handleGameRoomStart);
    getGameState();

    return () => {
      socketService.off('gameJoined', handleGameJoined);
      socketService.off('gameStateUpdate', handleGameStateUpdate);
      socketService.off('playerJoined', handlePlayerJoined);
      socketService.off('playerLeft', handlePlayerLeft);
      socketService.off('playerEliminated', handlePlayerEliminated);
      socketService.off('duelEnded', handleDuelEnded);
      socketService.off('timerUpdate', handleTimerUpdate);
      socketService.off('connect_error', handleConnectError);
      socketService.off('joinError', handleJoinError);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('gameRoomStart', handleGameRoomStart);
    };
  }, [isConnected, getGameState]);

  return {
    gameState,
    isConnected,
    error,
    connectToGame,
    disconnectFromGame,
    startTimer,
    restartTimer,
    correctAnswer,
    incorrectAnswer,
    bankMoney,
    nextQuestion,
    startVoting,
    voteForPlayer,
    endVoting,
    eliminateSpecificPlayer,
    startDuel,
    startDuelQuestions,
    duelAnswer,
    nextDuelQuestion,
    endDuel,
    getGameState,
    startGameRoom
  };
};
