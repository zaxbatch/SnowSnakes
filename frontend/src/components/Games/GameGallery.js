import React, { useEffect, useState, useRef, useContext } from 'react';
import ReactDOM from 'react-dom';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteMode } from '../../context/DeleteModeContext';
import CommentModal from '../CommentModal';
import LoadingSkeleton from '../LoadingSkeleton';
import ShareModal from '../ShareModal';
import useDeepLink from '../../utils/useDeepLink';

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

  const [shareTarget, setShareTarget] = useState(null);
  const [popular, setPopular] = useState(null);
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState(null);
  const [commentContentType, setCommentContentType] = useState('');

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await api.get('/games', { params: { search, sort } });
      // Keep the comments from the backend – do NOT reset to empty array.
      // isLiked comes from the server too (it is computed from the likes table
      // for the signed-in visitor); this used to be hard-coded to false here,
      // which is why a game you had already liked always looked unliked after
      // a reload.
      const gamesWithLikes = res.data.map((g) => ({ ...g, isLiked: !!g.isLiked }));
      setGames(gamesWithLikes);
      // If comment modal is open, update commentContent with fresh data
      if (commentModalOpen && commentContent) {
        const fresh = gamesWithLikes.find(g => g.id === commentContent.id);
        if (fresh) setCommentContent(fresh);
      }
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
      const res = await api.post(`/games/${gameId}/like`);
      if (res.data && typeof res.data.liked === 'boolean' && res.data.liked !== newLiked) {
        updateGame(gameId, (g) => ({
          ...g,
          isLiked: res.data.liked,
          likes: res.data.liked ? (g.likes || 0) + 1 : Math.max(0, (g.likes || 0) - 1),
        }));
      }
    } catch (err) {
      updateGame(gameId, (g) => ({
        ...g,
        isLiked: !newLiked,
        likes: newLiked ? (g.likes || 0) - 1 : (g.likes || 0) + 1,
      }));
      alert('Failed to like – please try again');
    }
  };


  const handleComment = async (gameId, text) => {
    const cleanText = String(text).trim();
    if (!cleanText) {
      alert('Comment cannot be empty');
      return;
    }

    // Optimistic update
    updateGame(gameId, (g) => ({
      ...g,
      comments: g.comments ? [...g.comments, { id: Date.now(), text: cleanText, user, created_at: new Date() }] : [{ id: Date.now(), text: cleanText, user, created_at: new Date() }],
    }));

    try {
      await api.post(`/games/${gameId}/comment`, { text: cleanText });
      // Refetch to get the updated comments from server and update commentContent
      await fetchGames();
      // fetchGames will update commentContent if modal is open
    } catch (err) {
      // Rollback
      updateGame(gameId, (g) => ({
        ...g,
        comments: g.comments ? g.comments.slice(0, -1) : [],
      }));
      alert('Error posting comment');
    }
  };

  // Arriving from a shared /games?game=42 link.
  useDeepLink('game', games, loading);

  const openShare = async (game) => {
    setShareTarget(game);
    // Count the share, and update the card immediately. Anyone can share, so
    // this no longer waits for a login.
    updateGame(game.id, (g) => ({ ...g, shares: (g.shares || 0) + 1 }));
    api.post(`/games/${game.id}/share`).catch(() => {});
    if (popular === null) {
      try {
        const res = await api.get('/games', { params: { sort: 'likes' } });
        const top = res.data && res.data[0];
        setPopular(top && top.id !== game.id ? { contentType: 'game', id: top.id, title: top.title } : false);
      } catch (err) {
        setPopular(false);
      }
    }
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
      // Remove in place — no full refetch, so the gallery updates instantly.
      setGames((prev) => prev.filter((g) => g.id !== id));
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
          /* These are !important above, so the already-liked state needs its own
             rule at the same weight or the heart never looks different from an
             unliked one. */
          .btn-like.liked {
            background: #ff0000 !important;
            box-shadow: inset 0 0 0 2px #000000 !important;
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
        <div className="flex justify-between align-center mb-20 sort-bar">
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control search-input"
          />
          <div className="flex gap-10 sort-options">
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
          <LoadingSkeleton variant="media" count={6} gridClass="grid-games" message="Loading games…" />
        ) : (
          <div className="grid-games">
            {games.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <span className="empty-icon">🎮</span>
                <p>No games submitted yet. Be the first!</p>
              </div>
            ) : (
              games.map(game => (
                <div className="game-card" key={game.id} id={`game-${game.id}`}>
                  {game.type === 'user' ? (
                    <div className="game-badge" style={{ background: '#ff6b6b', color: '#fff' }}>👤 USER</div>
                  ) : (
                    <div className="game-badge" style={{ background: '#ffcc00', color: '#000' }}>⭐ BUILT-IN</div>
                  )}
                  {/* The list endpoint returns file_count, not a files array
                      (the array column does not exist in production, so this
                      badge never rendered). */}
                  {game.file_count > 0 && (
                    <div className="game-badge" style={{ right: '80px', background: '#00cc66', color: '#fff' }}>
                      📁 {game.file_count}
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
                      className={`btn btn-sm ${game.isLiked ? 'btn-like liked' : 'btn-like'}`}
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
                      onClick={() => openShare(game)}
                      title="Share a direct link to this game"
                    >
                      <i className="fas fa-share-alt"></i> {game.shares || 0}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <CommentModal
          key={commentContent?.id || 'no-game'}
          isOpen={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
          content={commentContent}
          contentType="game"
          currentUser={user}
          onComment={handleComment}
        />

        <ShareModal
          open={!!shareTarget}
          onClose={() => setShareTarget(null)}
          contentType="game"
          contentId={shareTarget && shareTarget.id}
          title={shareTarget && shareTarget.title}
          subtitle={shareTarget && shareTarget.description}
          popular={popular || null}
        />
      </div>
    </>
  );
};

export default GameGallery;