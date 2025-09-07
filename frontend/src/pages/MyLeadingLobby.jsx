import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGameState } from '../hooks/useGameState';
import VotingComponent from '../components/VotingComponent';
import socketService from '../services/socketService';
import styles from './MyLeadingGameRoom.module.scss';

const MyLeadingLobby = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameId, playerName, gameState: initialGameState } = location.state || {};

  const {
    gameState,
    isConnected,
    error,
    connectToGame,
    startGameRoom,
    getGameState,
  } = useGameState(gameId, playerName, true);

  useEffect(() => {
    if (!gameId || !playerName) return;
    const info = socketService.getPlayerInfo();
    if (!socketService.isConnected() || info.gameId !== gameId) {
      connectToGame();
      return;
    }
    getGameState();
  }, [gameId, playerName, connectToGame, getGameState]);

  const handleStartGameRoom = () => {
    startGameRoom();
    navigate('/leading-game', {
      state: {
        gameId: gameId,
        playerName: playerName
      }
    });
  }

  const activePlayers = gameState?.players?.filter(p => p.isActive !== false) || [];
  const players = activePlayers.map(p => p.name);

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

      <div className={styles.topSection}>
        <div className={styles.playersSemicircle}>
          {players.map((name, i) => (
            <div key={i} className={`${styles.playerOval} ${styles[`player${i+1}`]}`}>
              <div className={styles.playerName}>{name}</div>
            </div>
          ))}
        </div>

        <div className={styles.questionSection}>
          <div className={styles.questionCard}>
            <h2 className={styles.questionText}>Ожидание игроков</h2>
          </div>
        </div>

        <div className={styles.controlsBar}>
          <button
            className={`${styles.ctrlBtn} ${styles.gameStart}`}
            onClick={handleStartGameRoom}>
              ▶️ Начать игру
          </button>
        </div>
      </div>

      <div className={styles.gameInfo}>
        <div className={styles.infoItem}>ID игры: {gameId}</div>
        <div className={styles.infoItem}>Ведущий: {playerName}</div>
      </div>

    </div>
  );
};

export default MyLeadingLobby;
