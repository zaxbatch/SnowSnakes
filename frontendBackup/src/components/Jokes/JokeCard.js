import React, { useState } from 'react';
import './JokeCard.css'; // you can copy your existing CSS

const JokeCard = ({ joke, onLike, onShare, onKill, onDelete, currentUser }) => {
  const [flipped, setFlipped] = useState(false);
  const isQnA = joke.punchline && joke.punchline.trim().length > 0;
  const killerClass = joke.kill_count > 50 ? 'killer' : '';

  return (
    <div className={`flip-card ${killerClass} ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
      <div className="flip-card-inner">
        <div className="flip-card-front">
          <div className="flip-actions">
            <span>💀 {joke.kill_count || 0}</span>
            {currentUser && currentUser.id === joke.author_id && (
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
          <div className="card-meta">👤 {joke.author?.display_name || 'anon'} • 🕐 {new Date(joke.created_at).toLocaleDateString()}</div>
          <div className="social-actions">
            <button className="btn btn-like btn-sm" onClick={(e) => { e.stopPropagation(); onLike(joke.id); }}>
              <i className="fas fa-heart"></i> {joke.likes || 0}
            </button>
            <button className="btn btn-comment btn-sm" onClick={(e) => e.stopPropagation()}>
              <i className="fas fa-comment"></i> {joke.comments?.length || 0}
            </button>
            <button className="btn btn-share btn-sm" onClick={(e) => { e.stopPropagation(); onShare(joke.id); }}>
              <i className="fas fa-share"></i> {joke.shares || 0}
            </button>
            {currentUser && (
              <button className="btn btn-warning btn-sm" onClick={(e) => { e.stopPropagation(); onKill(joke.id); }}>
                <i className="fas fa-bomb"></i>
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
  );
};

export default JokeCard;