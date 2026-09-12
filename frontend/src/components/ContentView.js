import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { useDeleteMode } from '../context/DeleteModeContext';
import SocialActions from './SocialActions';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import LoadingSkeleton, { LoadError } from './LoadingSkeleton';

// ─── A shared link's destination ─────────────────────────────────────────
// /jokes/42 (and the same shape for the other galleries) loads that one item
// on its own page rather than dropping the visitor into the full grid to hunt
// for it. The page then offers several ways onward, so arriving from a share is
// an invitation to explore rather than a dead end.

// Where the API lives for each type, and how the page presents it.
const TYPES = {
  joke: {
    label: 'Dad Joke', plural: 'jokes', api: '/jokes', emoji: '😂',
    gallery: 'Dad Jokes', cta: '😂 More Dad Jokes',
    blurb: 'Hundreds more groaners where that came from.',
    cross: [{ id: 'songs', cta: '🎵 Hear the songs', to: '/songs' },
            { id: 'games', cta: '🎮 Play a game', to: '/games' }],
  },
  doodle: {
    label: 'Doodle', plural: 'doodles', api: '/doodles', emoji: '🎨',
    gallery: 'Doodles', cta: '🎨 More Doodles',
    blurb: 'The whole fridge door of fan art.',
    cross: [{ id: 'music', cta: '🎵 Hear the songs', to: '/songs' },
            { id: 'random', cta: '🎲 Surprise me', to: '/randomizer' }],
  },
  song: {
    label: 'Song', plural: 'songs', api: '/songs', emoji: '🎵',
    gallery: 'Songs', cta: '🎵 More Music',
    blurb: 'More tracks from the condiment universe.',
    cross: [{ id: 'doodles', cta: '🎨 See the doodles', to: '/doodles' },
            { id: 'games', cta: '🎮 Play a game', to: '/games' }],
  },
  game: {
    label: 'Game', plural: 'games', api: '/games', emoji: '🎮',
    gallery: 'Mini Games', cta: '🎮 More Games',
    blurb: 'Playable mini games, all in the browser.',
    cross: [{ id: 'songs', cta: '🎵 Hear the songs', to: '/songs' },
            { id: 'jokes', cta: '😂 Read the jokes', to: '/jokes' }],
  },
  episode: {
    label: 'Episode', plural: 'spread', api: '/episodes', emoji: '🎬',
    gallery: 'Spread Da Word', cta: '🎬 Watch the Series',
    blurb: 'Every episode of Spread the Word.',
    cross: [{ id: 'songs', cta: '🎵 Hear the songs', to: '/songs' },
            { id: 'games', cta: '🎮 Play a game', to: '/games' }],
  },
};

const titleOf = (type, item) => {
  if (!item) return '';
  if (type === 'joke') return item.content;
  return item.title || '';
};

const subtitleOf = (type, item) => {
  if (!item) return '';
  if (type === 'joke') return item.series || (item.tags && item.tags.length ? `#${item.tags[0]}` : '');
  if (type === 'song') return item.author_name ? `by ${item.author_name}` : 'A community track';
  if (type === 'episode') return item.episode_number ? `Episode ${item.episode_number}` : '';
  if (type === 'doodle') return 'Fan art from the condiment universe';
  return item.author_name ? `by ${item.author_name}` : '';
};

const ContentPage = ({ type }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { deleteMode } = useDeleteMode();
  const meta = TYPES[type];

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [more, setMore] = useState([]);
  const [popular, setPopular] = useState([]);

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setNotFound(false);
    try {
      const res = await api.get(`${meta.api}/${id}`);
      setItem(res.data);
    } catch (err) {
      if (err.response && err.response.status === 404) setNotFound(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  }, [meta.api, id]);

  useEffect(() => { load(); }, [load]);

  // Suggestions load after the item, and a failure here must never spoil the
  // page: it is an extra, not the point.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [liked, newest] = await Promise.all([
          api.get(meta.api, { params: { sort: 'likes' } }).catch(() => null),
          api.get(meta.api).catch(() => null),
        ]);
        if (cancelled) return;
        const top = ((liked && liked.data) || []).filter((x) => String(x.id) !== String(id)).slice(0, 4);
        setPopular(top);
        const seen = new Set(top.map((x) => String(x.id)));
        const rest = ((newest && newest.data) || [])
          .filter((x) => String(x.id) !== String(id) && !seen.has(String(x.id)))
          .slice(0, 4);
        setMore(rest);
      } catch (err) {
        // Suggestions are optional; leave them empty.
      }
    })();
    return () => { cancelled = true; };
  }, [meta.api, id]);

  const handleComment = async (contentId, text) => {
    try {
      await api.post(`${meta.api}/${contentId}/comment`, { text });
      load();
    } catch (err) {
      alert('Please login to comment');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete this ${meta.label.toLowerCase()}?`)) return;
    try {
      await api.delete(`${meta.api}/${id}`);
      navigate(`/${meta.plural}`);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="panel active">
        <LoadingSkeleton variant="media" count={3} gridClass="grid-2" message={`Loading this ${meta.label.toLowerCase()}…`} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="panel active">
        <div className="empty-state">
          <span className="empty-icon">{meta.emoji}</span>
          <p>That {meta.label.toLowerCase()} isn&apos;t here any more.</p>
          <Link className="btn btn-primary" to={`/${meta.plural}`}>{meta.cta}</Link>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="panel active">
        <LoadError message={`Couldn't load this ${meta.label.toLowerCase()}.`} onRetry={load} />
      </div>
    );
  }

  const title = titleOf(type, item);
  const subtitle = subtitleOf(type, item);

  const Suggestion = ({ row, badge }) => (
    <Link className="suggest-card" to={`/${meta.plural}/${row.id}`}>
      <span className="suggest-badge">{badge}</span>
      <span className="suggest-title">{titleOf(type, row) || `${meta.label} #${row.id}`}</span>
      <span className="suggest-meta">
        {type === 'joke' ? `❤️ ${row.likes || 0}` : `❤️ ${row.likes || 0} · 👤 ${row.author_name || 'anon'}`}
      </span>
    </Link>
  );

  return (
    <div className="panel active content-page">
      <div className="content-nav">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <Link className="btn btn-secondary btn-sm" to={`/${meta.plural}`}>
          {meta.emoji} All {meta.gallery}
        </Link>
      </div>

      <div className="section-header" style={{ background: 'linear-gradient(135deg, #003399, #0066cc)' }}>
        <span className="section-icon">{meta.emoji}</span>
        <h2>{meta.label}</h2>
        <p>Shared with you</p>
      </div>

      {/* ─── The linked item, presented on its own ─── */}
      <div className="content-focus">
        {type === 'joke' && (
          <>
            <p className="focus-question">{item.content}</p>
            {item.punchline
              ? <p className="focus-answer">{item.punchline}</p>
              : <p className="focus-note">No punchline on this one — it speaks for itself.</p>}
            {item.series && <div className="focus-chip">📚 {item.series}</div>}
            {item.tags && item.tags.length > 0 && (
              <div className="focus-tags">{item.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
            )}
          </>
        )}

        {type === 'doodle' && (
          <>
            {item.image_url && item.image_url.startsWith('http') ? (
              <img className="focus-media" src={item.image_url} alt={item.title} />
            ) : (
              <div className="focus-emoji">{item.image_url || '🎨'}</div>
            )}
            <h3 className="focus-title">{item.title}</h3>
          </>
        )}

        {type === 'song' && (
          <>
            {item.cover_url && <img className="focus-media focus-cover" src={item.cover_url} alt={item.title} />}
            <h3 className="focus-title">{item.title}</h3>
            {item.audio_url && <audio className="focus-audio" src={item.audio_url} controls preload="metadata" />}
          </>
        )}

        {type === 'game' && (
          <>
            <div className="focus-emoji">{item.icon && !item.icon.startsWith('http') ? item.icon : '🎮'}</div>
            <h3 className="focus-title">{item.title}</h3>
            {item.description && <p className="focus-desc">{item.description}</p>}
          </>
        )}

        {type === 'episode' && (
          <>
            <h3 className="focus-title">{item.title}</h3>
            {item.description && <p className="focus-desc">{item.description}</p>}
            {item.air_date && <div className="focus-chip">📅 {item.air_date}</div>}
          </>
        )}

        {(() => {
          // Built as parts so a missing field leaves no empty row, and only one
          // date is shown: an episode's air date is the meaningful one, and
          // otherwise the created date is.
          const parts = [];
          if (type !== 'joke' && item.author_name) parts.push(`👤 ${item.author_name}`);
          if (type === 'episode' && item.air_date) {
            parts.push(`📅 Aired ${item.air_date}`);
          } else if (item.created_at) {
            parts.push(`📅 ${new Date(item.created_at).toLocaleDateString()}`);
          }
          if (item.plays) parts.push(`🎮 ${item.plays} plays`);
          return parts.length ? <div className="focus-meta">{parts.join(' · ')}</div> : null;
        })()}

        {(type === 'game' || type === 'episode') && (
          <Link className="btn btn-primary focus-play" to={`/${meta.plural}`}>
            <i className="fas fa-play"></i> {type === 'game' ? 'Open in the games page to play' : 'Open in the series page to watch'}
          </Link>
        )}

        <SocialActions
          contentType={type}
          contentId={item.id}
          likes={item.likes || 0}
          shares={item.shares || 0}
          commentCount={item.comments ? item.comments.length : 0}
          isLiked={!!item.isLiked}
          currentUser={user}
          onOpenCommentModal={() => setShowComments(true)}
          onShare={() => setShowShare(true)}
          onUpdate={(liked) => setItem((prev) => (prev ? {
            ...prev,
            isLiked: liked,
            likes: liked ? (prev.likes || 0) + 1 : Math.max(0, (prev.likes || 0) - 1),
          } : prev))}
        />

        {deleteMode && (
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <i className="fas fa-trash"></i> DELETE
          </button>
        )}
      </div>

      {/* ─── Onward ─── */}
      <div className="explore-block">
        <h3 className="explore-head">{meta.emoji} Keep exploring</h3>

        <Link className="explore-big" to={`/${meta.plural}`}>
          <span className="explore-emoji">{meta.emoji}</span>
          <span className="explore-text">
            <strong>{meta.cta}</strong>
            <em>{meta.blurb}</em>
          </span>
          <span className="explore-go">→</span>
        </Link>

        <div className="explore-cross">
          {meta.cross.map((c) => (
            <Link key={c.id} className="explore-chip" to={c.to}>{c.cta}</Link>
          ))}
        </div>

        {popular.length > 0 && (
          <>
            <h4 className="suggest-head">🔥 Popular {meta.plural}</h4>
            <div className="suggest-list">
              {popular.map((row) => <Suggestion key={row.id} row={row} badge="🔥" />)}
            </div>
          </>
        )}

        {more.length > 0 && (
          <>
            <h4 className="suggest-head">✨ Fresh {meta.plural}</h4>
            <div className="suggest-list">
              {more.map((row) => <Suggestion key={row.id} row={row} badge="✨" />)}
            </div>
          </>
        )}

        <div className="explore-cross">
          <Link className="explore-chip" to="/">🏠 Home</Link>
          <Link className="explore-chip" to="/randomizer">🎲 Random</Link>
          <Link className="explore-chip" to="/songs">🎵 Music</Link>
        </div>
      </div>

      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        content={item}
        contentType={type}
        currentUser={user}
        onComment={handleComment}
      />

      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        contentType={type}
        contentId={item.id}
        title={title}
        subtitle={subtitle}
        popular={null}
      />
    </div>
  );
};

export default ContentPage;
