import React, { useState } from 'react';
import ReactDOM from 'react-dom';

const CommentModal = ({ isOpen, onClose, joke, currentUser, onComment }) => {
  const [commentText, setCommentText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(joke.id, commentText.trim());
    setCommentText('');
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay active"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="modal-header">
          <h2>💬 Comments</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px' }}>
          {joke.comments && joke.comments.length > 0 ? (
            joke.comments.map(c => (
              <div className="comment-item" key={c.id} style={{ marginBottom: '8px' }}>
                <span className="comment-user">{c.display_name || c.username}</span>
                <span className="comment-text">{c.text}</span>
                <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
              </div>
            ))
          ) : (
            <div style={{ color: '#95a5a6', padding: '10px 0' }}>No comments yet. Be the first!</div>
          )}
        </div>
        {currentUser ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="form-control"
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-success">
              <i className="fas fa-paper-plane"></i> Post
            </button>
          </form>
        ) : (
          <div style={{ color: '#95a5a6', padding: '10px 0' }}>
            <a href="#" onClick={(e) => e.preventDefault()}>Login</a> to comment.
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default CommentModal;