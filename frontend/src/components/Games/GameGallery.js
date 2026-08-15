import React, { useEffect, useState } from 'react';
import api from '../../api';

const GameGallery = () => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    api.get('/games')
      .then(res => setGames(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleVote = (id) => {
    api.post(`/games/${id}/vote`)
      .then(() => {
        setGames(games.map(g => g.id === id ? { ...g, votes: g.votes + 1 } : g));
      });
  };

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #00cc66, #00ff99)' }}>
        <span className="section-icon">🎮</span>
        <h2>MINI GAMES</h2>
        <p>Play user-submitted games — or submit your own!</p>
      </div>
      <div className="grid-games">
        {games.map(g => (
          <div className="game-card" key={g.id}>
            <span className="game-icon">{g.icon || '🎮'}</span>
            <div className="game-title">{g.title}</div>
            <div className="game-description">{g.description}</div>
            <div className="game-meta">
              👤 {g.author_name || 'anon'} • 👍 {g.votes || 0} • 🎮 {g.plays || 0}
            </div>
            <div className="game-actions">
              <button className="btn btn-primary btn-sm" onClick={() => alert('Play game: ' + g.title)}>
                <i className="fas fa-play"></i> PLAY
              </button>
              <button className="btn btn-like btn-sm" onClick={() => handleVote(g.id)}>
                <i className="fas fa-thumbs-up"></i> {g.votes || 0}
              </button>
            </div>
          </div>
        ))}
        {games.length === 0 && <p>No games yet.</p>}
      </div>
    </div>
  );
};

export default GameGallery;