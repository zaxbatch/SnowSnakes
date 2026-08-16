import React, { useEffect, useState, useRef, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteMode } from '../../context/DeleteModeContext';
import SocialActions from '../SocialActions';
import CommentModal from '../CommentModal';

// ─── Extract YouTube video ID from URL or return the input if it's already an ID ───
const extractYouTubeId = (input) => {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?/]+)/,
  ];
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  const fallbackMatch = input.match(/[a-zA-Z0-9_-]{11}/);
  return fallbackMatch ? fallbackMatch[0] : null;
};

const EpisodeList = () => {
  const { user } = useContext(AuthContext);
  const { deleteMode } = useDeleteMode();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // ─── Comment modal state ───
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState(null);
  const [commentContentType, setCommentContentType] = useState('');

  const fetchEpisodes = async () => {
    try {
      const res = await api.get('/episodes');
      setEpisodes(res.data);
    } catch (err) {
      console.error('Failed to fetch episodes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const playEpisode = (ep) => {
    const videoId = extractYouTubeId(ep.youtube_id);
    if (!videoId) {
      alert('Invalid YouTube ID or URL. Please check the episode.');
      console.warn('Failed to extract ID from:', ep.youtube_id);
      return;
    }
    setActiveEpisode({ ...ep, youtube_id: videoId });
  };

  const closeModal = () => {
    setActiveEpisode(null);
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

  const getThumbnail = (ep) => {
    const id = extractYouTubeId(ep.youtube_id);
    if (!id) return '';
    return ep.thumbnail_url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  };

  const deleteEpisode = async (id) => {
    if (!window.confirm('Delete this episode?')) return;
    try {
      await api.delete(`/episodes/${id}`);
      fetchEpisodes();
    } catch (err) {
      alert('Failed to delete episode');
    }
  };

  // ─── Comment handlers ──────────────────────────────────────
  const handleComment = async (contentId, text) => {
    try {
      await api.post(`/episodes/${contentId}/comment`, { text });
      fetchEpisodes();
      setCommentModalOpen(false);
    } catch (err) {
      alert('Error posting comment');
    }
  };

  const openCommentModal = (item) => {
    setCommentContent(item);
    setCommentContentType('episode');
    setCommentModalOpen(true);
  };

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
        <span className="section-icon">🎬</span>
        <h2>SPREAD DA WORD</h2>
        <p>The official Snowsnakes animated series — watch only!</p>
      </div>

      <div style={{ background: '#fff3cd', border: '3px solid #ff9900', padding: '12px 18px', borderRadius: '15px', marginBottom: '20px', textAlign: 'center' }}>
        <span style={{ fontWeight: 700, color: '#856404' }}>🎬 This is the official animated series!</span>
        <span style={{ display: 'block', fontSize: '13px', color: '#856404', marginTop: '4px' }}>📺 Episodes are created by the Snowsnakes team — sit back and enjoy!</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading episodes...</div>
      ) : episodes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📺</span>
          <p>No episodes yet. Stay tuned!</p>
        </div>
      ) : (
        <div className="grid-spread">
          {episodes.map(ep => {
            const thumb = getThumbnail(ep);
            return (
              <div className="spread-card" key={ep.id}>
                <div className="episode-badge">{ep.episode_number || 'SPECIAL'}</div>
                {ep.featured && <div className="episode-featured">⭐ FEATURED</div>}
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', marginBottom: '10px' }}>
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={ep.title}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  ) : (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '3rem' }}>🎬</span>
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '60px',
                      cursor: 'pointer',
                      opacity: 0.9,
                      transition: '0.2s',
                      textShadow: '0 0 20px rgba(0,0,0,0.8)',
                    }}
                    onClick={() => playEpisode(ep)}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                  >
                    ▶️
                  </div>
                </div>
                <h3 style={{ fontFamily: "'Comic Sans MS', cursive", color: '#e67e22' }}>{ep.title}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '4px' }}>{ep.description}</p>
                <div className="spread-meta">
                  <span className="episode-number">{ep.episode_number || 'SPECIAL'}</span>
                  <span className="episode-date">📅 {ep.air_date || 'TBA'}</span>
                </div>
                <div className="spread-actions" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => playEpisode(ep)}>
                    <i className="fas fa-play"></i> Watch Now
                  </button>
                  {deleteMode && (
                    <button className="btn btn-danger" onClick={() => deleteEpisode(ep.id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
                <SocialActions
                  contentType="episode"
                  contentId={ep.id}
                  likes={ep.likes || 0}
                  shares={ep.shares || 0}
                  commentCount={ep.comments ? ep.comments.length : 0}
                  currentUser={user}
                  onUpdate={fetchEpisodes}
                  onOpenCommentModal={() => openCommentModal(ep)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Video Modal ─── */}
      {activeEpisode && (
        <div
          className="game-play-modal active"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="modal-box"
            style={{
              maxWidth: '1100px',
              width: '85vw',
              maxHeight: '85vh',
              height: '70vh',
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#222',
                color: '#fff',
                padding: '10px 20px',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>▶️ {activeEpisode.title}</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${activeEpisode.youtube_id}`, '_blank')}
                  style={{ background: '#3498db', color: '#fff' }}
                >
                  <i className="fas fa-external-link-alt"></i> NEW TAB
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={toggleFullscreen}
                  style={{ background: '#ffcc00', color: '#000' }}
                >
                  <i className="fas fa-expand"></i> {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={closeModal}
                  style={{ background: '#ff4444', color: '#fff' }}
                >
                  <i className="fas fa-times"></i> CLOSE
                </button>
              </div>
            </div>
            <div ref={containerRef} style={{ flex: 1, backgroundColor: '#000', position: 'relative', minHeight: '300px' }}>
              <iframe
                src={`https://www.youtube.com/embed/${activeEpisode.youtube_id}?autoplay=1&rel=0`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                }}
                title={activeEpisode.title}
                allowFullScreen
                allow="autoplay; fullscreen"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Comment Modal ─── */}
      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        content={commentContent}
        contentType={commentContentType}
        currentUser={user}
        onComment={handleComment}
      />
    </div>
  );
};

export default EpisodeList;