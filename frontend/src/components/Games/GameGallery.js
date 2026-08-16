import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api';
import { useDeleteMode } from '../../context/DeleteModeContext';

const BACKEND_URL = api.defaults.baseURL.replace(/\/api$/, '');

const GameGallery = ({ setShowGameModal }) => {
  const { deleteMode } = useDeleteMode();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState(null);
  const [gameUrl, setGameUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await api.get('/games');
      setGames(res.data);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const handleVote = async (id) => {
    try {
      await api.post(`/games/${id}/vote`);
      fetchGames();
    } catch (err) {
      alert('Please login to vote');
    }
  };

  const handlePlay = async (game) => {
    try {
      await api.post(`/games/${game.id}/play`);
    } catch (err) {
      console.error('Play count error:', err);
    }
    const url = `${BACKEND_URL}/api/games/${game.id}/launch?_=${Date.now()}`;
    setGameUrl(url);
    setActiveGame(game);
  };

  const closeGame = () => {
    setActiveGame(null);
    setGameUrl(null);
    if (isFullscreen) exitFullscreen();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      exitFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this game?')) return;
    try {
      await api.delete(`/games/${id}`);
      fetchGames();
    } catch (err) {
      alert('Failed to delete game');
    }
  };

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #00cc66, #00ff99)' }}>
        <span className="section-icon">🎮</span>
        <h2>MINI GAMES</h2>
        <p>Play user-submitted games — or submit your own!</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button className="btn btn-success" onClick={() => setShowGameModal(true)}>
          <i className="fas fa-upload"></i> SUBMIT GAME
        </button>
        <button className="btn btn-secondary" onClick={fetchGames}>
          <i className="fas fa-sync"></i> REFRESH
        </button>
      </div>

      {activeGame && gameUrl && ReactDOM.createPortal(
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
                {game.type === 'user' ? (
                  <div className="game-badge" style={{ background: '#ff6b6b', color: '#fff' }}>👤 USER</div>
                ) : (
                  <div className="game-badge" style={{ background: '#ffcc00', color: '#000' }}>⭐ BUILT-IN</div>
                )}
                {game.files && game.files.length > 0 && (
                  <div className="game-badge" style={{ right: '80px', background: '#00cc66', color: '#fff' }}>
                    📁 {game.files.length}
                  </div>
                )}
                <span className="game-icon" style={{ display: 'block', textAlign: 'center' }}>
                  {game.icon && game.icon.startsWith('http') ? (
                    <img src={game.icon} alt={game.title} style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
                  ) : (
                    game.icon || '🎮'
                  )}
                </span>
                <div className="game-title">{game.title}</div>
                <div className="game-description">{game.description}</div>
                <div className="game-meta">
                  👤 {game.author_name || 'Anonymous'} • 👍 {game.votes || 0} • 🎮 {game.plays || 0}<br />
                  {game.tags && game.tags.map(t => <span key={t} className="tag" style={{ fontSize: '9px' }}>#{t}</span>)}
                </div>
                <div className="game-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handlePlay(game)}>
                    <i className="fas fa-play"></i> PLAY
                  </button>
                  <button className="btn btn-like btn-sm" onClick={() => handleVote(game.id)}>
                    <i className="fas fa-thumbs-up"></i> {game.votes || 0}
                  </button>
                  {(deleteMode || (game.author_id && game.author_id === 1)) && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(game.id)}>
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