import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import VotingComponent from '../components/VotingComponent';
import socketService from '../services/socketService';
import styles from './MyLeadingGameRoom.module.scss';

const MyLeadingGameRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId, playerName, gameState: initialGameState } = location.state || {};

  const {
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
    getGameState
  } = useGameState(gameId, playerName, true);

  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
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
      setIsTimerRunning(gameState.isTimerRunning ?? false);
      setCurrentScoreLevel(gameState.currentScoreLevel ?? -1);
      setCurrentPlayerIndex(gameState.currentPlayerIndex ?? 0);
      setBank(gameState.bank ?? 0);
      setTotalBank(gameState.totalBank ?? 0);
      setCurrentQuestionIndex(gameState.currentQuestionIndex ?? 0);
    }
  }, [gameState]);

  const handleCorrect = () => {
    correctAnswer();
    nextQuestion();
  };

  const handleIncorrect = () => {
    incorrectAnswer();
    nextQuestion();
  };

  const handleBank = () => {
    bankMoney();
  };

  const handleNextQuestion = () => {
    nextQuestion();
  };

  const handleStartTimer = () => {
    startTimer();
  };

  const handleRestartTimer = () => {
    restartTimer();
  };

  const handleStartDuel = () => {
    startDuel();
  };

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
  const canStartDuel = activePlayers.length === 2;
  const canStartVoating = activePlayers.length > 1;
  useEffect(() => {
    if (gameState?.gameState === 'duel_ready' || gameState?.gameState === 'duel') {
      navigate('/leading-duel', { 
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
          
          {scoreLevels.map((level, index) => {
            const isActive = index === currentScoreLevel;
            return (
              <div 
                key={level.value} 
                className={`${styles.scoreOval} ${isActive ? styles.active : ''}`}
              >
                <div className={styles.ovalValue}>{level.value.toLocaleString()}</div>
              </div>
            );
          })}
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
            <h2 className={styles.questionText}>
              {isReadyState ? "ПРИГОТОВЬТЕСЬ" : currentQuestion.question}
            </h2>
            {isReadyState && (
              <p className={styles.readySubtext}>
                Нажмите кнопку "Начать вопросы" чтобы начать вопросы
              </p>
            )}
          </div>
        </div>

        <div className={styles.controlsBar}>
          <button 
            className={`${styles.ctrlBtn} ${styles.primary}`} 
            onClick={isTimerRunning ? handleRestartTimer : handleStartTimer}
            disabled={!isReadyState && !isTimerRunning}
          >
            {isTimerRunning ? 'Перезапустить таймер' : isReadyState ? 'Начать вопросы' : 'Таймер'}
          </button>
          <button 
            className={`${styles.ctrlBtn} ${styles.success}`} 
            onClick={handleBank}
            disabled={currentScoreLevel < 0 || !isPlayingState}
          >
            Банк
          </button>
          <button 
            className={`${styles.ctrlBtn} ${styles.nextQuestion}`} 
            onClick={handleNextQuestion}
            disabled={!isPlayingState}
          >
            Следующий вопрос
          </button>
          <button 
            className={`${styles.ctrlBtn} ${canStartVoating ? styles.danger : ''}`} 
            onClick={startVoting}
            disabled={!canStartVoating}
          >
            Начать голосование
          </button>
          <button 
            className={`${styles.ctrlBtn} ${styles.duel} ${canStartDuel ? styles.duelActive : ''}`} 
            onClick={handleStartDuel}
            disabled={!canStartDuel}
          >
            Начать дуэль
          </button>
        </div>

        <div className={styles.answerControls}>
          <button 
            className={`${styles.ctrlBtn} ${styles.correct}`} 
            onClick={handleCorrect}
            disabled={!isPlayingState}
          >
            ✅ Верно
          </button>
          <button 
            className={`${styles.ctrlBtn} ${styles.incorrect}`} 
            onClick={handleIncorrect}
            disabled={!isPlayingState}
          >
            ❌ Неверно
          </button>
        </div>

        {isPlayingState && (
          <div className={styles.answerDisplay}>
            <div className={styles.answerText}>{currentQuestion.answer}</div>
          </div>
        )}
      </div>

      <div className={styles.gameInfo}>
        <div className={styles.infoItem}>ID игры: {gameId}</div>
        <div className={styles.infoItem}>Ведущий: {playerName}</div>
        <div className={styles.infoItem}>
          Накоплено: {totalBank.toLocaleString()} ₽
        </div>
      </div>

      <VotingComponent
        gameState={gameState}
        currentPlayerId={currentPlayerId}
        onVoteForPlayer={voteForPlayer}
        onStartVoting={startVoting}
        onEndVoting={endVoting}
        onEliminateSpecificPlayer={eliminateSpecificPlayer}
        isLeader={true}
      />
    </div>
  );
};

export default MyLeadingGameRoom;
