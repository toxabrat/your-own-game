import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import socketService from '../services/socketService';
import styles from './MyDuelRoom.module.scss';

const MyDuelRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId, playerName, gameState: initialGameState } = location.state || {};

  const {
    gameState,
    isConnected,
    error,
    connectToGame,
  } = useGameState(gameId, playerName, false);

  const [duelQuestionIndex, setDuelQuestionIndex] = useState(0);
  const [duelScores, setDuelScores] = useState(new Map());
  const [duelResults, setDuelResults] = useState(new Map());
  const [currentDuelPlayerIndex, setCurrentDuelPlayerIndex] = useState(0);

  useEffect(() => {
    if (gameId && playerName) {
      connectToGame();
    }
  }, [gameId, playerName, connectToGame, initialGameState]);

  useEffect(() => {
    if (gameState) {
      setDuelQuestionIndex(gameState.duelQuestionIndex || 0);
      setDuelScores(new Map(gameState.duelScores || []));
      setDuelResults(new Map(gameState.duelResults || []));
      setCurrentDuelPlayerIndex(gameState.currentDuelPlayerIndex || 0);
    }
  }, [gameState]);

  const currentQuestion = gameState?.currentQuestion || {
    question: "Загрузка вопроса...",
    answer: "Загрузка ответа..."
  };

  const isDuelReady = gameState?.gameState === 'duel_ready';
  const players = gameState?.players?.filter(p => p.isActive !== false) || [];
  useEffect(() => {
    const handleDuelEnded = (data) => {
      if (data.winner) {
        navigate('/end-game', { state: { winner: data.winner, totalBank: data.totalBank || 0 } });
      }
    };

    socketService.on('duelEnded', handleDuelEnded);

    return () => {
      socketService.off('duelEnded', handleDuelEnded);
    };
  }, [navigate]);

  useEffect(() => {
    if (gameState?.gameState === 'finished') {
      let maxScore = 0;
      let winner = null;

      for (const [playerId, score] of duelScores) {
        if (score > maxScore) {
          maxScore = score;
          winner = gameState?.players?.find(p => p.id === playerId);
        }
      }
      if (!winner && gameState?.players?.length > 0) {
        winner = gameState.players[0];
      }

      navigate('/end-game', { state: { winner, totalBank: gameState?.totalBank || 0 } });
    }
  }, [gameState, duelScores, navigate]);

  if (error) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.errorMessage}>
          <h2>Ошибка подключения</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/my-begin')}>
            Вернуться в меню
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !gameState) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingMessage}>
          <h2>Подключение к дуэли...</h2>
          <p>ID игры: {gameId}</p>
        </div>
      </div>
    );
  }

  if (gameState.gameState && gameState.gameState !== 'duel_ready' && gameState.gameState !== 'duel') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.errorMessage}>
          <h2>Дуэль не активна</h2>
          <p>Игра не находится в состоянии дуэли</p>
          <button onClick={() => navigate('/lobby', { state: { gameId, playerName, gameState } })}>
            Вернуться в лобби
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.duelHeader}>
        <h1>ДУЭЛЬ</h1>
      </div>

      <div className={styles.playersSection}>
        {players.map((player) => {
          const results = duelResults.get(player.id) || [];
          const isCurrentPlayer = gameState?.duelPlayerOrder?.[currentDuelPlayerIndex] === player.id;
          
          return (
            <div key={player.id} className={`${styles.playerCard} ${isCurrentPlayer ? styles.currentPlayer : ''}`}>
              <div className={styles.playerName}>{player.name}</div>
              <div className={styles.scoreCircles}>
                {[0, 1, 2, 3, 4].map((circleIndex) => {
                  const result = results[circleIndex];
                  return (
                    <div 
                      key={circleIndex} 
                      className={`${styles.scoreCircle} ${
                        result === true ? styles.correct : 
                        result === false ? styles.incorrect : ''
                      }`}
                    >
                      {result === true ? '✓' : result === false ? '✗' : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.questionSection}>
        <div className={styles.questionCard}>
          <h2 className={styles.questionText}>
            {isDuelReady ? "ПРИГОТОВЬТЕСЬ" : currentQuestion.question}
          </h2>
          {isDuelReady && (
            <p className={styles.readySubtext}>
              Ведущий скоро начнет дуэль
            </p>
          )}
        </div>
      </div>

      <div className={styles.gameInfo}>
        <div className={styles.infoItem}>ID игры: {gameId}</div>
        <div className={styles.infoItem}>Игрок: {playerName}</div>
      </div>

    </div>
  );
};

export default MyDuelRoom;


