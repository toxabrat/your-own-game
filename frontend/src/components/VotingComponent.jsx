import React from 'react';
import styles from './VotingComponent.module.scss';

const VotingComponent = ({ 
  gameState, 
  currentPlayerId, 
  onVoteForPlayer, 
  onEndVoting, 
  onEliminateSpecificPlayer,
  isLeader 
}) => {
  const { 
    players, 
    votingStarted, 
    votingEnded, 
    votes, 
    voteCounts 
  } = gameState || {};

  const votesMap = new Map(votes || []);
  const voteCountsMap = new Map(voteCounts || []);
  const hasVoted = votesMap.has(currentPlayerId);
  const votedFor = votesMap.get(currentPlayerId);

  const getVoteCount = (playerId) => {
    return voteCountsMap.get(playerId) || 0;
  };
  const isCurrentPlayerActive = () => {
    const currentPlayer = players?.find(p => p.id === currentPlayerId);
    return currentPlayer?.isActive !== false;
  };

  if (!votingStarted && !votingEnded) {
    return null;
  }

  if (votingStarted && !votingEnded) {
    return (
      <div className={styles.votingContainer}>
        <div className={styles.votingStatus}>
          <h3>Голосование началось!</h3>
          <p>Выберите игрока, которого хотите исключить:</p>
        </div>

        <div className={styles.playersGrid}>
          {players.filter(player => player.isActive !== false).map((player) => {
            if (isLeader) {
              return (
                <div key={player.id} className={styles.playerVoteCard}>
                  <div className={styles.playerName}>{player.name}</div>
                </div>
              );
            }

            if (!isCurrentPlayerActive()) {
              return (
                <div key={player.id} className={styles.playerVoteCard}>
                  <div className={styles.playerName}>{player.name}</div>
                </div>
              );
            }

            if (player.id === currentPlayerId) {
              return (
                <div key={player.id} className={styles.playerVoteCard}>
                  <div className={styles.playerName}>{player.name}</div>
                </div>
              );
            }

            if (hasVoted) {
              return (
                <div key={player.id} className={styles.playerVoteCard}>
                  <div className={styles.playerName}>{player.name}</div>
                  <div className={styles.votedStatus}>
                    {votedFor === player.id ? (
                      <span className={styles.votedFor}>✅ Вы проголосовали за этого игрока</span>
                    ) : (
                      <span className={styles.votedForOther}>❌ Вы уже проголосовали</span>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={player.id} className={styles.playerVoteCard}>
                <div className={styles.playerName}>{player.name}</div>
                <button 
                  className={styles.voteBtn}
                  onClick={() => onVoteForPlayer(player.id)}
                >
                   Голосовать
                </button>
              </div>
            );
          })}
        </div>

        {isLeader && (
          <button 
            className={`${styles.votingBtn} ${styles.endVoting}`}
            onClick={onEndVoting}
          >
            ⏹️ Завершить голосование ⏹️
          </button>
        )}
      </div>
    );
  }

  if (votingEnded) {
    return (
      <div className={styles.votingContainer}>
        <div className={styles.votingStatus}>
          <h3>Результаты голосования</h3>
          {isLeader && <p>Нажмите на игрока, которого хотите исключить:</p>}
        </div>

        <div className={styles.resultsGrid}>
          {players.filter(player => player.isActive !== false).map((player) => {
            const voteCount = getVoteCount(player.id);
            
            return (
              <div 
                key={player.id} 
                className={styles.resultCard}
                onClick={() => {
                  if (isLeader) {
                    onEliminateSpecificPlayer(player.id);
                  }
                }}
                style={{ cursor: isLeader ? 'pointer' : 'default' }}
              >
                <div className={styles.playerName}>{player.name}</div>
                <div className={styles.voteCount}>
                  {voteCount} голос{voteCount === 1 ? '' : voteCount < 5 ? 'а' : 'ов'}
                </div>
                {isLeader && (
                  <div className={styles.eliminateHint}>Нажмите для исключения</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default VotingComponent;
