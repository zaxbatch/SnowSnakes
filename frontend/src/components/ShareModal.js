import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';

// ─── Share a post ────────────────────────────────────────────────────────
// Opens with the direct link to one item, a copy button, the platform share
// sheet where the browser has one, and a few onward links so a share is also
// an invitation to explore the rest of the site rather than a dead end.

// Builds the canonical link for an item. The route is the gallery and the item
// is a query parameter, so the URL stays readable and pasteable and the link
// keeps working regardless of how the galleries are paginated later.
export const shareUrlFor = (contentType, id) => {
  const route = contentType === 'episode' ? 'spread' : `${contentType}s`;
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://snowsnakes.zerric.xyz';
  // A real page for the item, not the gallery with a hint attached: the
  // visitor should land on the thing that was shared.
  return `${base}/${route}/${id}`;
};

const plural = { joke: 'jokes', doodle: 'doodles', song: 'songs', game: 'games', episode: 'episodes' };

const EXPLORE = {
  joke: {
    label: 'dad jokes', emoji: '😂',
    cta: '😂 More Dad Jokes',
    blurb: 'Hundreds more groaners where that came from.',
  },
  doodle: {
    label: 'doodles', emoji: '🎨',
    cta: '🎨 More Doodles',
    blurb: 'The whole fridge door of fan art.',
  },
  song: {
    label: 'music', emoji: '🎵',
    cta: '🎵 More Music',
    blurb: 'More tracks from the condiment universe.',
  },
  game: {
    label: 'games', emoji: '🎮',
    cta: '🎮 More Games',
    blurb: 'Playable mini games, all in the browser.',
  },
  episode: {
    label: 'episodes', emoji: '🎬',
    cta: '🎬 Watch the Series',
    blurb: 'Every episode of Spread Da Word.',
  },
};

const ShareModal = ({ open, onClose, contentType, contentId, title, subtitle, popular }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const inputRef = useRef(null);

  const link = open && contentType && contentId ? shareUrlFor(contentType, contentId) : '';
  const explore = EXPLORE[contentType] || EXPLORE.joke;
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Reset transient state each time it opens, and preselect the link so a
  // keyboard copy works without reaching for the button.
  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setShareFailed(false);
    const t = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  // Escape closes, matching every other modal on the site.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else if (inputRef.current) {
        // Older browsers, and any context where the async clipboard API is
        // unavailable (it requires a secure origin).
        inputRef.current.select();
        document.execCommand('copy');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      setShareFailed(true);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: subtitle || title, url: link });
      onClose();
    } catch (err) {
      // Cancelling the share sheet throws too, so this stays quiet unless the
      // share genuinely could not start.
      if (err && err.name !== 'AbortError') setShareFailed(true);
    }
  };

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  return ReactDOM.createPortal(
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔗 Share this {contentType}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {title && (
          <div className="share-preview">
            <div className="share-preview-title">{title}</div>
            {subtitle && <div className="share-preview-sub">{subtitle}</div>}
          </div>
        )}

        <label className="share-label" htmlFor="share-link">Direct link</label>
        <div className="share-link-row">
          <input
            id="share-link"
            ref={inputRef}
            className="form-control share-link-input"
            value={link}
            readOnly
            onFocus={(e) => e.target.select()}
          />
          <button type="button" className="btn btn-primary" onClick={copyLink}>
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="share-hint">
          Anyone opening this lands straight on this {contentType}
          {subtitle ? ` — ${subtitle}` : ''}.
        </p>

        {canNativeShare && (
          <button type="button" className="btn btn-success share-native" onClick={nativeShare}>
            <i className="fas fa-share-nodes"></i> Share via…
          </button>
        )}
        {shareFailed && (
          <p className="share-hint share-warn">
            Couldn&apos;t reach the share tools — select the link above and copy it manually.
          </p>
        )}

        {/* ── Onward links, so a share also invites exploration ── */}
        <div className="share-explore">
          <div className="share-explore-head">While you&apos;re here</div>

          <button type="button" className="explore-card explore-primary" onClick={() => goTo(`/${plural[contentType] || 'jokes'}`)}>
            <span className="explore-emoji">{explore.emoji}</span>
            <span className="explore-text">
              <strong>{explore.cta}</strong>
              <em>{explore.blurb}</em>
            </span>
            <span className="explore-go">→</span>
          </button>

          {popular && (
            <button type="button" className="explore-card" onClick={() => goTo(`/${plural[popular.contentType]}/${popular.id}`)}>
              <span className="explore-emoji">🔥</span>
              <span className="explore-text">
                <strong>Popular post right now</strong>
                <em>{popular.title}</em>
              </span>
              <span className="explore-go">→</span>
            </button>
          )}

          <div className="explore-row">
            <button type="button" className="explore-chip" onClick={() => goTo('/')}>🏠 Home</button>
            <button type="button" className="explore-chip" onClick={() => goTo('/randomizer')}>🎲 Random</button>
            <button type="button" className="explore-chip" onClick={() => goTo('/games')}>🎮 Games</button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default ShareModal;
