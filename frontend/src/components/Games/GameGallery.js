import React, { useEffect, useState, useRef, useContext } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteMode } from '../../context/DeleteModeContext';
import CommentModal from '../CommentModal';

const BACKEND_URL = api.defaults.baseURL.replace(/\/api$/, '');

const GameGallery = ({ setShowGameModal }) => {
  const { user } = useContext(AuthContext);
  const { deleteMode } = useDeleteMode();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [activeGame, setActiveGame] = useState(null);
  const [gameUrl, setGameUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef(null);
  const containerRef = useRef(null);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState(null);
  const [commentContentType, setCommentContentType] = useState('');

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await api.get('/games', { params: { search, sort } });
      const gamesWithLikes = res.data.map(g => ({ ...g, isLiked: false, comments: [] }));
      setGames(gamesWithLikes);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [search, sort]);

  const updateGame = (gameId, updater) => {
    setGames(prev =>
      prev.map(game =>
        game.id === gameId ? updater(game) : game
      )
    );
  };

  const fetchGameComments = async (gameId) => {
    try {
      const res = await api.get(`/games/${gameId}/comments`);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      return [];
    }
  };

  const handleLike = async (gameId) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    const newLiked = !game.isLiked;
    const newLikes = newLiked ? (game.likes || 0) + 1 : (game.likes || 0) - 1;

    updateGame(gameId, (g) => ({
      ...g,
      isLiked: newLiked,
      likes: newLikes,
    }));

    try {
      await api.post(`/games/${gameId}/like`);
    } catch (err) {
      updateGame(gameId, (g) => ({
        ...g,
        isLiked: !newLiked,
        likes: newLiked ? (g.likes || 0) - 1 : (g.likes || 0) + 1,
      }));
      alert('Failed to like – please try again');
    }
  };

  const handleShare = async (gameId) => {
    const game = games.find(g => g.id === gameId);
    if (!game) return;

    updateGame(gameId, (g) => ({
      ...g,
      shares: (g.shares || 0) + 1,
    }));

    try {
      const res = await api.post(`/games/${gameId}/share`);
      if (res.data && res.data.shares !== undefined) {
        updateGame(gameId, (g) => ({
          ...g,
          shares: res.data.shares,
        }));
      }
    } catch (err) {
      updateGame(gameId, (g) => ({
        ...g,
        shares: (g.shares || 0) - 1,
      }));
      alert('Failed to share – please try again');
    }
  };

  const handleComment = async (gameId, text) => {
    // Ensure text is a string and trim it
    const cleanText = String(text).trim();
    if (!cleanText) {
      alert('Comment cannot be empty');
      return;
    }

    console.log('📝 handleComment called with:', { gameId, text: cleanText });

    // Optimistic update
    updateGame(gameId, (g) => ({
      ...g,
      comments: g.comments ? [...g.comments, { id: Date.now(), text: cleanText, user, created_at: new Date() }] : [{ id: Date.now(), text: cleanText, user, created_at: new Date() }],
    }));

    try {
      await api.post(`/games/${gameId}/comment`, { text: cleanText });
      const comments = await fetchGameComments(gameId);
      updateGame(gameId, (g) => ({
        ...g,
        comments,
      }));
    } catch (err) {
      // Rollback
      updateGame(gameId, (g) => ({
        ...g,
        comments: g.comments ? g.comments.slice(0, -1) : [],
      }));
      alert('Error posting comment');
    }
    setCommentModalOpen(false);
  };

  const openCommentModal = async (game) => {
    const comments = await fetchGameComments(game.id);
    const gameWithComments = { ...game, comments };
    setCommentContent(gameWithComments);
    setCommentContentType('game');
    setCommentModalOpen(true);
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
    <>
      <style>
        {`
          .btn-like-active {
            background: #b30000 !important;
            color: #fff !important;
          }
          .btn-like {
            background: #e74c3c !important;
            color: #fff !important;
          }
        `}
      </style>
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

        {/* ─── Search & Sort ─── */}
        <div className="flex justify-between align-center mb-20" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ width: '200px' }}
          />
          <div className="flex gap-10">
            <button className="btn btn-secondary" onClick={() => setSort('likes')}>MOST LIKED</button>
            <button className="btn btn-secondary" onClick={() => setSort('plays')}>MOST PLAYED</button>
            <button className="btn btn-secondary" onClick={() => setSort('votes')}>MOST VOTED</button>
            <button className="btn btn-secondary" onClick={() => setSort('newest')}>NEWEST</button>
            <button className="btn btn-secondary" onClick={() => setSort('oldest')}>OLDEST</button>
          </div>
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
                    {(deleteMode || (game.author_id && game.author_id === 1)) && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(game.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>

                  <div className="social-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'center' }}>
                    <button
                      className={`btn btn-sm ${game.isLiked ? 'btn-like-active' : 'btn-like'}`}
                      onClick={() => handleLike(game.id)}
                      disabled={!user}
                    >
                      <i className="fas fa-heart"></i> {game.likes || 0}
                    </button>
                    <button
                      className="btn btn-sm btn-comment"
                      onClick={() => openCommentModal(game)}
                      disabled={!user}
                    >
                      <i className="fas fa-comment"></i> {game.comments ? game.comments.length : 0}
                    </button>
                    <button
                      className="btn btn-sm btn-share"
                      onClick={() => handleShare(game.id)}
                      disabled={!user}
                    >
                      <i className="fas fa-share-alt"></i> {game.shares || 0}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ✅ KEY prop forces a fresh CommentModal instance */}
        <CommentModal
          key={commentContent?.id || 'no-game'}
          isOpen={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
          content={commentContent}
          contentType={commentContentType}
          currentUser={user}
          onComment={(text) => {
            console.log('📝 CommentModal onComment called with text:', text);
            if (commentContent && commentContent.id) {
              handleComment(commentContent.id, text);
            } else {
              alert('Error: No game selected for comment');
            }
          }}
        />
      </div>
    </>
  );
};

export default GameGallery;