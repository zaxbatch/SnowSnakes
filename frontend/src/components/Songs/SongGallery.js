import React, { useEffect, useRef, useState, useContext, useCallback } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useDeleteMode } from '../../context/DeleteModeContext';
import SocialActions from '../SocialActions';
import CommentModal from '../CommentModal';
import LoadingSkeleton, { LoadError } from '../LoadingSkeleton';

// ─── A single song: cover art, title, and a real audio player ────────────
const SongCard = ({ song, currentUser, deleteMode, onDelete, onOpenComments }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  // Track the playhead in seconds. Deriving everything from one number avoids
  // the rounding drift that came from storing a percentage and converting back.
  const [currentTime, setCurrentTime] = useState(0);
  const [failed, setFailed] = useState(false);

  // Keep the button in sync when playback ends or the browser pauses it
  // (e.g. a phone call interrupts audio playback).
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onPlayEvt = () => setPlaying(true);
    const onPauseEvt = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    el.addEventListener('play', onPlayEvt);
    el.addEventListener('pause', onPauseEvt);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('play', onPlayEvt);
      el.removeEventListener('pause', onPauseEvt);
      el.removeEventListener('ended', onEnded);
    };
  }, [song.audio_url]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => setFailed(true));
    } else {
      el.pause();
    }
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const seek = (e) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
    const seconds = (Number(e.target.value) / 100) * el.duration;
    el.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="song-card">
      <div className="song-cover-wrap">
        {song.cover_url ? (
          <img className="song-cover" src={song.cover_url} alt={`Cover art for ${song.title}`} loading="lazy" />
        ) : (
          <div className="song-cover song-cover-fallback" aria-hidden="true">🎵</div>
        )}
        <button
          type="button"
          className={`song-play-btn ${playing ? 'is-playing' : ''}`}
          onClick={togglePlay}
          disabled={failed}
          aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`}
        >
          <i className={`fas ${failed ? 'fa-triangle-exclamation' : playing ? 'fa-pause' : 'fa-play'}`}></i>
        </button>
      </div>

      {song.audio_url && !failed && (
        <audio
          ref={audioRef}
          src={song.audio_url}
          // "metadata" rather than "none": it fetches only the headers so the
          // track length is known up front. With "none" every card showed
          // "--:--" until the visitor actually pressed play.
          preload="metadata"
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          // Fires when the playhead moves without timeupdate: dragging the
          // browser's own audio controls, or a keyboard/OS media key.
          onSeeked={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onError={() => setFailed(true)}
        />
      )}

      {failed ? (
        <p className="song-error">This track couldn&apos;t be played.</p>
      ) : (
        <div className="song-progress">
          <span className="song-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progressPct}
            onChange={seek}
            aria-label={`Seek within ${song.title}`}
          />
          <span className="song-time">{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
      )}

      <h3 className="song-title">{song.title}</h3>
      <div className="song-meta">
        🎤 {song.author_name || 'anonymous'}
        {song.created_at ? ` • 📅 ${new Date(song.created_at).toLocaleDateString()}` : ''}
      </div>

      {deleteMode && (
        <button className="btn btn-danger btn-sm mt-20" onClick={() => onDelete(song.id)}>
          <i className="fas fa-trash"></i> DELETE
        </button>
      )}

      <SocialActions
        contentType="song"
        contentId={song.id}
        likes={song.likes || 0}
        shares={song.shares || 0}
        commentCount={song.comments ? song.comments.length : 0}
        currentUser={currentUser}
        onOpenCommentModal={() => onOpenComments(song)}
      />
    </div>
  );
};

// ─── The gallery ─────────────────────────────────────────────────────────
const SongGallery = () => {
  const { user } = useContext(AuthContext);
  const { deleteMode } = useDeleteMode();
  const [songs, setSongs] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState(null);

  const fetchSongs = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/songs', { params: { search, sort } });
      setSongs(res.data);
      if (commentModalOpen && commentContent) {
        const fresh = res.data.find((s) => s.id === commentContent.id);
        if (fresh) setCommentContent(fresh);
      }
    } catch (err) {
      console.error('Failed to fetch songs:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, [search, sort]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this song? Its audio and cover will be removed too.')) return;
    try {
      await api.delete(`/songs/${id}`);
      // Remove in place — no full refetch, so the gallery updates instantly.
      setSongs((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Failed to delete song');
    }
  };

  const handleComment = async (id, text) => {
    try {
      await api.post(`/songs/${id}/comment`, { text });
      fetchSongs();
    } catch (err) {
      alert('Please login to comment');
    }
  };

  const openComments = (song) => {
    setCommentContent(song);
    setCommentModalOpen(true);
  };

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }}>
        <span className="section-icon">🎵</span>
        <h2>SONGS</h2>
        <p>Fan-made tracks from the condiment universe — upload an mp3 and its cover</p>
      </div>

      {/* ─── Search & Sort ─── */}
      <div className="flex justify-between align-center mb-20 sort-bar">
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control search-input"
        />
        <div className="flex gap-10 sort-options">
          <button className="btn btn-secondary" onClick={() => setSort('likes')}>MOST LIKED</button>
          <button className="btn btn-secondary" onClick={() => setSort('newest')}>NEWEST</button>
          <button className="btn btn-secondary" onClick={() => setSort('oldest')}>OLDEST</button>
          <button className="btn btn-secondary" onClick={() => setSort('title')}>A–Z</button>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton variant="tile" count={6} gridClass="grid-songs" message="Loading songs…" />
      ) : error ? (
        <LoadError message="Couldn't load the songs." onRetry={fetchSongs} />
      ) : songs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎵</span>
          <p>No songs yet — be the first to upload one!</p>
        </div>
      ) : (
        <div className="grid-songs">
          {songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              currentUser={user}
              deleteMode={deleteMode}
              onDelete={handleDelete}
              onOpenComments={openComments}
            />
          ))}
        </div>
      )}

      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        content={commentContent}
        contentType="song"
        currentUser={user}
        onComment={handleComment}
      />
    </div>
  );
};

export default SongGallery;
