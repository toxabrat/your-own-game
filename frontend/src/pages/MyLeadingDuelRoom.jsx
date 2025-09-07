import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import socketService from '../services/socketService';
import styles from './MyLeadingDuelRoom.module.scss';

const MyLeadingDuelRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId, playerName, gameState: initialGameState } = location.state || {};

  const {
    gameState,
    isConnected,
    error,
    connectToGame,
    disconnectFromGame,
    startDuelQuestions,
    duelAnswer,
    nextDuelQuestion,
    endDuel,
    getGameState
  } = useGameState(gameId, playerName, true);

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

  const handleCorrectAnswer = (playerId) => {
    duelAnswer(playerId, true);
    setTimeout(() => {
      nextDuelQuestion();
    }, 500);
  };

  const handleIncorrectAnswer = (playerId) => {
    duelAnswer(playerId, false);
    setTimeout(() => {
      nextDuelQuestion();
    }, 500);
  };

  const handleNextQuestion = () => {
    nextDuelQuestion();
  };

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

  const handleEndDuel = () => {
    endDuel();
  };

  const currentQuestion = gameState?.currentQuestion || {
    question: "Загрузка вопроса...",
    answer: "Загрузка ответа..."
  };

  const duelPlayers = gameState?.players?.filter(p => p.isActive !== false) || [];

  const isDuelReady = gameState?.gameState === 'duel_ready';
  const isDuelActive = gameState?.gameState === 'duel';

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

  if (gameState && gameState.gameState && gameState.gameState !== 'duel_ready' && gameState.gameState !== 'duel') {
    return (
      <div className={styles.wrapper}>
        <div className={styles.errorMessage}>
          <h2>Дуэль не активна</h2>
          <p>Игра не находится в состоянии дуэли</p>
          <button onClick={() => navigate('/leading-game', { state: { gameId, playerName, gameState } })}>
            Вернуться к игре
          </button>
        </div>
      </div>
    );
  }

  const currentPlayerId = gameState?.duelPlayerOrder?.[currentDuelPlayerIndex];
  const currentPlayer = duelPlayers.find(p => p.id === currentPlayerId);

  return (
    <div className={styles.wrapper}>
      <div className={styles.duelHeader}>
        <h1>ДУЭЛЬ - ВЕДУЩИЙ</h1>
      </div>

      <div className={styles.playersSection}>
        {duelPlayers.map((player) => {
          const results = duelResults.get(player.id) || [];
          const isCurrentPlayer = player.id === currentPlayerId;
          
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
              Нажмите кнопку "Начать" чтобы начать вопросы дуэли
            </p>
          )}
        </div>
      </div>

      <div className={styles.controlsSection}>
        {isDuelReady ? (
          <div className={styles.gameControls}>
            <button 
              className={styles.controlBtn}
              onClick={startDuelQuestions}
            >
              Начать дуэль
            </button>
          </div>
        ) : isDuelActive ? (
          <>
            {currentPlayer && (
              <div className={styles.currentPlayerControls}>
                <div className={styles.currentPlayerName}>
                  Ход: {currentPlayer.name}
                </div>
                <div className={styles.answerButtons}>
                  <button 
                    className={`${styles.answerBtn} ${styles.correct}`}
                    onClick={() => handleCorrectAnswer(currentPlayer.id)}
                  >
                    ✅ Верно
                  </button>
                  <button 
                    className={`${styles.answerBtn} ${styles.incorrect}`}
                    onClick={() => handleIncorrectAnswer(currentPlayer.id)}
                  >
                    ❌ Неверно
                  </button>
                </div>
              </div>
            )}

            <div className={styles.gameControls}>
              <button 
                className={styles.controlBtn}
                onClick={handleNextQuestion}
              >
                Следующий вопрос
              </button>
              <button 
                className={`${styles.controlBtn} ${styles.endDuel}`}
                onClick={handleEndDuel}
              >
                Завершить дуэль
              </button>
            </div>
          </>
        ) : null}
      </div>

      {isDuelActive && (
        <div className={styles.answerDisplay}>
          <div className={styles.answerLabel}>Ответ:</div>
          <div className={styles.answerText}>{currentQuestion.answer}</div>
        </div>
      )}

      <div className={styles.gameInfo}>
        <div className={styles.infoItem}>ID игры: {gameId}</div>
        <div className={styles.infoItem}>Ведущий: {playerName}</div>
      </div>
    </div>
  );
};

export default MyLeadingDuelRoom;
