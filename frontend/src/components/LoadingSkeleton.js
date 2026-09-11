import React from 'react';

// Placeholder cards shown while a gallery loads.
//
// Why this exists: on a cold free-tier backend a list request can take
// several seconds. Previously the jokes, doodles and songs pages rendered
// nothing at all during that window, so a slow load looked like a broken
// page. These skeletons reserve the same space the real cards will occupy,
// so the page appears instantly and then fills in.

const Bar = ({ w = '100%', h = 12, mb = 8 }) => (
  <div className="skeleton-bar" style={{ width: w, height: h, marginBottom: mb }} />
);

// Mirrors the shape of a flip-card joke: question text, series/tags, meta
// line and a row of social buttons.
export const JokeSkeleton = () => (
  <div className="flip-card no-flip skeleton-card" aria-hidden="true">
    <div className="skeleton-inner">
      <Bar w="85%" h={16} mb={10} />
      <Bar w="60%" h={16} mb={14} />
      <Bar w="40%" h={10} mb={6} />
      <Bar w="30%" h={10} mb={14} />
      <div className="skeleton-actions">
        <Bar w={56} h={22} mb={0} />
        <Bar w={44} h={22} mb={0} />
        <Bar w={48} h={22} mb={0} />
      </div>
    </div>
  </div>
);

// Mirrors a game / spread card: media block, title, description, meta.
export const MediaCardSkeleton = ({ media = true }) => (
  <div className="skeleton-card skeleton-card-media" aria-hidden="true">
    <div className="skeleton-inner">
      {media && <div className="skeleton-block" style={{ height: 130, marginBottom: 12 }} />}
      <Bar w="75%" h={15} mb={8} />
      <Bar w="95%" h={11} mb={6} />
      <Bar w="88%" h={11} mb={14} />
      <div className="skeleton-actions">
        <Bar w={60} h={22} mb={0} />
        <Bar w={44} h={22} mb={0} />
      </div>
    </div>
  </div>
);

// Mirrors a doodle / song card: art block, title, actions.
export const TileSkeleton = () => (
  <div className="skeleton-card skeleton-card-tile" aria-hidden="true">
    <div className="skeleton-inner">
      <div className="skeleton-block" style={{ height: 110, marginBottom: 10 }} />
      <Bar w="70%" h={13} mb={10} />
      <div className="skeleton-actions">
        <Bar w={50} h={20} mb={0} />
        <Bar w={40} h={20} mb={0} />
        <Bar w={44} h={20} mb={0} />
      </div>
    </div>
  </div>
);

// A full gallery of placeholders plus an accessible status line, so screen
// readers are told the content is still loading rather than meeting an
// empty page.
const LoadingSkeleton = ({ variant = 'media', count = 6, gridClass = 'grid-2', message = 'Loading…' }) => {
  const Skeleton = variant === 'joke' ? JokeSkeleton : variant === 'tile' ? TileSkeleton : MediaCardSkeleton;
  return (
    <div role="status" aria-live="polite">
      <p className="loading-message">
        <span className="loading-spinner" aria-hidden="true" />
        {message}
      </p>
      <div className={gridClass} aria-busy="true">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </div>
    </div>
  );
};

// Shown when a fetch fails outright, so the visitor gets a reason and a
// way to try again instead of an empty page.
export const LoadError = ({ message = 'Something went wrong loading this page.', onRetry }) => (
  <div className="load-error" role="alert">
    <span className="load-error-icon" aria-hidden="true">⚠️</span>
    <p>{message}</p>
    {onRetry && (
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        <i className="fas fa-sync"></i> TRY AGAIN
      </button>
    )}
  </div>
);

export default LoadingSkeleton;
