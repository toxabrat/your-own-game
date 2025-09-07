import { useNavigate, useLocation } from 'react-router-dom';
import styles from './EndGameRoom.module.scss';

const EndGameRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { winner, totalBank } = location.state || {};

  const handleReturnToMenu = () => {
    navigate('/my-begin');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.background}></div>
      
      <div className={styles.content}>
        <div className={styles.winnerCard}>
          <h1 className={styles.title}>🏆 ПОБЕДИТЕЛЬ 🏆</h1>
          <div className={styles.winnerName}>
            {winner ? winner.name : 'Неизвестный игрок'}
          </div>
          <div className={styles.winnerAmount}>
            Выиграно: {totalBank ? totalBank.toLocaleString() : 0} ₽
          </div>
          
          <button 
            className={styles.returnButton}
            onClick={handleReturnToMenu}
          >
            Вернуться в меню
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndGameRoom;
