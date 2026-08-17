import React, { useState } from 'react';
import { useDeleteMode } from '../../context/DeleteModeContext';
import { useKillerMode } from '../../context/KillerModeContext';
import CommentModal from '../CommentModal';

const JokeCard = ({ joke, onLike, onShare, onKill, onDelete, onComment, currentUser }) => {
  const [flipped, setFlipped] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { deleteMode } = useDeleteMode();
  const { killerMode } = useKillerMode();
  const isQnA = joke.punchline && joke.punchline.trim().length > 0;
  const killerClass = (killerMode && joke.kill_count > 50) ? 'killer' : '';
  const noFlipClass = !isQnA ? 'no-flip' : '';

  const isLiked = currentUser && joke.liked_by && joke.liked_by.includes(String(currentUser.id));

  const handleCardClick = () => {
    if (isQnA) setFlipped(!flipped);
  };

  const toggleComments = (e) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  return (
    <>
      <div
        className={`flip-card ${killerClass} ${noFlipClass} ${flipped ? 'flipped' : ''}`}
        onClick={handleCardClick}
        style={{ cursor: isQnA ? 'pointer' : 'default' }}
      >
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <div className="flip-actions">
              {killerMode && (
                <span style={{ color: '#ff0000', fontWeight: '900', marginRight: '6px' }}>
                  💀 {joke.kill_count || 0}
                </span>
              )}
              {(deleteMode || (currentUser && currentUser.id === joke.author_id)) && (
                <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(joke.id); }}>
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
            <div className="card-question">{joke.content}</div>
            {joke.series && <div className="card-series">📚 {joke.series}</div>}
            <div className="card-tags">
              {joke.tags && joke.tags.map(t => <span key={t} className="tag">#{t}</span>)}
            </div>
            <div className="card-meta">
              👤 {joke.author?.display_name || joke.author?.username || 'anon'} • 🕐 {new Date(joke.created_at).toLocaleDateString()}
            </div>

            <div className="social-actions">
              <button className={`btn btn-like btn-sm ${isLiked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); onLike(joke.id); }}>
                <i className="fas fa-heart"></i> {joke.likes || 0}
              </button>
              <button className="btn btn-comment btn-sm" onClick={toggleComments}>
                <i className="fas fa-comment"></i> {joke.comments ? joke.comments.length : 0}
              </button>
              <button className="btn btn-share btn-sm" onClick={(e) => { e.stopPropagation(); onShare(joke.id); }}>
                <i className="fas fa-share"></i> {joke.shares || 0}
              </button>
              {(killerMode || currentUser) && (
                <button className="btn btn-warning btn-sm" onClick={(e) => { e.stopPropagation(); onKill(joke.id); }}>
                  <i className="fas fa-bomb"></i> {killerMode ? 'KILL' : 'KILL'}
                </button>
              )}
            </div>

            {isQnA && <div className="flip-hint">👆 Click to reveal</div>}
          </div>

          {isQnA && (
            <div className="flip-card-back">
              <div className="card-answer-emoji">💡</div>
              <div className="card-answer">{joke.punchline}</div>
              <div className="flip-hint-back">👆 Flip back</div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Comment Modal ─── */}
      <CommentModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        content={joke}
        contentType="joke"
        currentUser={currentUser}
        onComment={onComment}
      />
    </>
  );
};

export default JokeCard;