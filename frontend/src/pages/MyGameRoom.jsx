import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import VotingComponent from '../components/VotingComponent';
import socketService from '../services/socketService';
import styles from './MyGameRoom.module.scss';

const MyGameRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId, playerName, gameState: initialGameState } = location.state || {};

  const {
    gameState,
    isConnected,
    error,
    connectToGame,
    disconnectFromGame,
    voteForPlayer,
    getGameState
  } = useGameState(gameId, playerName, false);

  const [timeLeft, setTimeLeft] = useState(180);
  const [currentScoreLevel, setCurrentScoreLevel] = useState(-1);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [bank, setBank] = useState(0);
  const [totalBank, setTotalBank] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (!gameId || !playerName) return;

    const info = socketService.getPlayerInfo();
    if (!socketService.isConnected() || info.gameId !== gameId) {
      connectToGame();
      return;
    }

    getGameState();
  }, [gameId, playerName, connectToGame, getGameState]);

  useEffect(() => {
    if (gameState) {
      setTimeLeft(gameState.timeLeft ?? 180);
      setCurrentScoreLevel(gameState.currentScoreLevel ?? -1);
      setCurrentPlayerIndex(gameState.currentPlayerIndex ?? 0);
      setBank(gameState.bank ?? 0);
      setTotalBank(gameState.totalBank ?? 0);
      setCurrentQuestionIndex(gameState.currentQuestionIndex ?? 0);
    }
  }, [gameState]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = gameState?.currentQuestion || {
    question: "Загрузка вопроса...",
    answer: "Загрузка ответа..."
  };

  const isReadyState = gameState?.gameState === 'ready';
  const isPlayingState = gameState?.gameState === 'playing';
  const activePlayers = gameState?.players?.filter(p => p.isActive !== false) || [];
  const players = activePlayers.map(p => p.name);

  const scoreLevels = gameState?.scoreLevels || [
    { value: 1000 },
    { value: 2000 },
    { value: 5000 },
    { value: 10000 },
    { value: 20000 },
    { value: 30000 },
    { value: 40000 },
    { value: 50000 }
  ];

  const currentPlayerId = socketService.getSocketId();

  useEffect(() => {
    if (gameState?.gameState === 'duel_ready' || gameState?.gameState === 'duel') {
      navigate('/duel', { 
        state: { 
          gameId: gameId, 
          playerName: playerName, 
          gameState 
        } 
      });
    }
  }, [gameState, gameId, playerName, navigate]);

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

  if (!isConnected) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.loadingMessage}>
          <h2>Подключение к игре...</h2>
          <p>ID игры: {gameId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.leftPanel}>
        <div className={styles.scoreOvals}>
          <div className={styles.scoreOval}>
            <div className={styles.ovalValue}>{bank.toLocaleString()}</div>
            <div className={styles.ovalLabel}>БАНК</div>
          </div>
          
          {scoreLevels.map((level, index) => (
            <div 
              key={level.value} 
              className={`${styles.scoreOval} ${index === currentScoreLevel ? styles.active : ''}`}
            >
              <div className={styles.ovalValue}>{level.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.timerPanel}>
        <div className={styles.timer}>
          <div className={styles.timerDisplay}>{formatTime(timeLeft)}</div>
        </div>
      </div>

      <div className={styles.topSection}>
        <div className={styles.playersSemicircle}>
          {players.map((name, i) => {
            const isCurrentPlayer = isPlayingState && i === currentPlayerIndex;
            return (
              <div key={i} className={`${styles.playerOval} ${styles[`player${i+1}`]} ${isCurrentPlayer ? styles.currentPlayer : ''}`}>
                <div className={styles.playerName}>{name}</div>
              </div>
            );
          })}
        </div>

        <div className={styles.questionSection}>
          <div className={styles.questionCard}>
            <div className={styles.questionText}>
              {isReadyState ? "ПРИГОТОВЬТЕСЬ" : currentQuestion.question}
            </div>
            {isReadyState && (
              <p className={styles.readySubtext}>
                Ведущий запустит таймер для начала вопросов
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={styles.gameInfo}>
        <div className={styles.infoItem}>ID игры: {gameId}</div>
        <div className={styles.infoItem}>Игрок: {playerName}</div>
        <div className={styles.infoItem}>
          Накоплено: {totalBank.toLocaleString()} ₽
        </div>
      </div>

      <VotingComponent
        gameState={gameState}
        currentPlayerId={currentPlayerId}
        onVoteForPlayer={voteForPlayer}
        onStartVoting={() => {}}
        onEndVoting={() => {}}
        onEliminatePlayer={() => {}}
        isLeader={false}
      />
    </div>
  );
};

export default MyGameRoom;
