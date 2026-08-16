import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';  // ✅ Import ReactDOM
import api from '../../api';

// Get the backend base URL (without the /api suffix)
const BACKEND_URL = api.defaults.baseURL.replace(/\/api$/, '');

const GameGallery = ({ setShowGameModal }) => {
  // ... (all state and functions unchanged until the return)

  return (
    <div className="panel active">
      {/* ... header and buttons unchanged ... */}

      {/* ─── Game Play Modal – rendered via Portal ─── */}
      {activeGame && gameUrl &&
        ReactDOM.createPortal(
          <div className="game-play-modal active" style={{ display: 'flex' }}>
            <div className="modal-box">
              <div className="game-header">
                <span style={{ fontSize: '1.2rem' }}>
                  {activeGame.icon && activeGame.icon.startsWith('http') ? (
                    <img src={activeGame.icon} alt={activeGame.title} style={{ width: '32px', height: '32px', objectFit: 'contain', marginRight: '8px', verticalAlign: 'middle' }} />
                  ) : (
                    activeGame.icon || '🎮'
                  )}
                  {activeGame.title}
                </span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-warning btn-sm" onClick={toggleFullscreen} style={{ background: '#ffcc00', color: '#000' }}>
                    <i className="fas fa-expand"></i> {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={closeGame} style={{ background: '#ff4444', color: '#fff' }}>
                    <i className="fas fa-times"></i> CLOSE
                  </button>
                </div>
              </div>
              <div className="game-body" ref={containerRef}>
                <iframe
                  ref={iframeRef}
                  src={gameUrl}
                  title={activeGame.title}
                  sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                />
              </div>
            </div>
          </div>,
          document.getElementById('modal-root')
        )}

      {/* ─── Game list rendering ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading games...</div>
      ) : (
        <div className="grid-games">
          {games.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <span className="empty-icon">🎮</span>
              <p>No games submitted yet. Be the first!</p>
            </div>
          ) : (
            games.map(game => (
              <div className="game-card" key={game.id}>
                {/* ... game card content (unchanged) ... */}
                <div className="game-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handlePlay(game)}>
                    <i className="fas fa-play"></i> PLAY
                  </button>
                  <button className="btn btn-like btn-sm" onClick={() => handleVote(game.id)}>
                    <i className="fas fa-thumbs-up"></i> {game.votes || 0}
                  </button>
                  {game.author_id && game.author_id === 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => {
                      if (window.confirm('Delete this game?')) {
                        api.delete(`/games/${game.id}`).then(fetchGames);
                      }
                    }}>
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GameGallery;