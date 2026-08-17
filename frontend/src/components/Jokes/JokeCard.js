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
  const killerClass = (killerMode && (joke.kill_count || 0) > 50) ? 'killer' : '';
  const noFlipClass = !isQnA ? 'no-flip' : '';

  const isLiked = currentUser && joke.liked_by && joke.liked_by.includes(String(currentUser.id));

  const handleCardClick = (e) => {
    if (e.target.closest('button, a, [data-ignore-click]')) return;
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
            <div className="flip-actions" data-ignore-click>
              {killerMode && (
                <span style={{ color: '#ff0000', fontWeight: '900', marginRight: '6px' }}>
                  💀 {joke.kill_count || 0}
                </span>
              )}
              {(deleteMode || (currentUser && currentUser.id === joke.author_id)) && (
                <button className="btn btn-danger btn-sm" data-ignore-click onClick={(e) => { e.stopPropagation(); onDelete(joke.id); }}>
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

            <div className="social-actions" data-ignore-click>
              <button className={`btn btn-like btn-sm ${isLiked ? 'liked' : ''}`} data-ignore-click onClick={(e) => { e.stopPropagation(); onLike(joke.id); }}>
                <i className="fas fa-heart"></i> {joke.likes || 0}
              </button>
              <button className="btn btn-comment btn-sm" data-ignore-click onClick={toggleComments}>
                <i className="fas fa-comment"></i> {joke.comments ? joke.comments.length : 0}
              </button>
              <button className="btn btn-share btn-sm" data-ignore-click onClick={(e) => { e.stopPropagation(); onShare(joke.id); }}>
                <i className="fas fa-share"></i> {joke.shares || 0}
              </button>
              <button className="btn btn-warning btn-sm" data-ignore-click onClick={(e) => { e.stopPropagation(); onKill(joke.id); }}>
                <i className="fas fa-bomb"></i> {killerMode ? 'KILL' : 'KILL'}
              </button>
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