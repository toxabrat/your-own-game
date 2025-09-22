import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socketService';
import styles from './MyBeginingRoom.module.scss';

const MyBeginingRoom = () => {
  const [role, setRole] = useState('host');
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const canSubmit = name.trim() && (role === 'host' || (role === 'player' && gameId.trim()));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsConnecting(true);
    setError('');

    try {
      let finalGameId = gameId.trim();

      if (role === 'host') {
        finalGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      socketService.joinGame(finalGameId, name.trim(), role === 'host');
      socketService.socket.once('gameJoined', (gameState) => {
        setIsConnecting(false);
        if (role === 'host') {
          navigate('/leading-lobby', { 
            state: { 
              gameId: finalGameId, 
              playerName: name.trim(), 
              gameState 
            } 
          });
        } else {
          navigate('/lobby', { 
            state: { 
              gameId: finalGameId, 
              playerName: name.trim(), 
              gameState 
            } 
          });
        }
      });

      socketService.socket.once('connect_error', (error) => {
        console.error('Connection error:', error);
        setError('Connection error');
        setIsConnecting(false);
      });

      socketService.socket.once('joinError', (error) => {
        console.error('Join error:', error);
        setError(error.message || 'Error joining game');
        setIsConnecting(false);
      });

      const timeout = setTimeout(() => {
        setError('Connection timeout - server not responding');
        setIsConnecting(false);
      }, 10000);

      socketService.socket.once('gameJoined', () => {
        clearTimeout(timeout);
      });
      socketService.socket.once('connect_error', () => {
        clearTimeout(timeout);
      });
      socketService.socket.once('joinError', () => {
        clearTimeout(timeout);
      });

    } catch (error) {
      console.error('Error joining game:', error);
      setError('Error joining game');
      setIsConnecting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.rightPane}>
        <div className={styles.card}>
          <h1 className={styles.title}>Слабое звено</h1>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Ваше имя</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите имя"
                maxLength={20}
                disabled={isConnecting}
              />
            </div>

            <div className={styles.roleToggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${role === 'host' ? styles.active : ''}`}
                onClick={() => setRole('host')}
                disabled={isConnecting}
              >
                 Ведущий
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${role === 'player' ? styles.active : ''}`}
                onClick={() => setRole('player')}
                disabled={isConnecting}
              >
                 Игрок
              </button>
            </div>

            {role === 'player' && (
              <div className={styles.inputGroup}>
                <label htmlFor="gameId">ID игры</label>
                <input
                  id="gameId"
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value.toUpperCase())}
                  placeholder="Например: ABC123"
                  maxLength={6}
                  disabled={isConnecting}
                />
              </div>
            )}

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={!canSubmit || isConnecting}>
              {isConnecting ? 'Подключение...' : (role === 'host' ? ' Создать игру' : ' Войти в игру')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyBeginingRoom;