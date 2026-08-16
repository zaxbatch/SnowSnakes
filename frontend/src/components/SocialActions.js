import React, { useState } from 'react';
import api from '../api';

const SocialActions = ({ contentType, contentId, likes = 0, comments = [], shares = 0, currentUser, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localLikes, setLocalLikes] = useState(likes);
  const [localShares, setLocalShares] = useState(shares);
  const [localComments, setLocalComments] = useState(comments);
  const [isLiked, setIsLiked] = useState(
    currentUser && comments.some(c => c.user_id === currentUser.id) // we need a better way – we'll fetch like status separately
  );

  // We'll fetch like status on mount – but for simplicity, we'll rely on the parent to pass isLiked.

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please login to like');
      return;
    }
    try {
      const res = await api.post(`/${contentType}s/${contentId}/like`);
      // res.data.liked tells us if it's now liked or not
      setIsLiked(res.data.liked);
      setLocalLikes(res.data.liked ? localLikes + 1 : localLikes - 1);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error liking');
    }
  };

  const handleShare = async () => {
    if (!currentUser) {
      alert('Please login to share');
      return;
    }
    try {
      await api.post(`/${contentType}s/${contentId}/share`);
      setLocalShares(localShares + 1);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error sharing');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/${contentType}s/${contentId}/comment`, { text: commentText });
      setLocalComments([res.data, ...localComments]);
      setCommentText('');
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error posting comment');
    }
  };

  return (
    <div>
      <div className="social-actions">
        <button
          className={`btn btn-like btn-sm ${isLiked ? 'liked' : ''}`}
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
        >
          <i className="fas fa-heart"></i> {localLikes}
        </button>
        <button
          className="btn btn-comment btn-sm"
          onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
        >
          <i className="fas fa-comment"></i> {localComments.length}
        </button>
        <button
          className="btn btn-share btn-sm"
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
        >
          <i className="fas fa-share"></i> {localShares}
        </button>
      </div>

      {showComments && (
        <div className="comments-section open" style={{ marginTop: '8px', padding: '8px', borderTop: '2px solid #bdc3c7' }}>
          <div className="comment-list">
            {localComments.length === 0 ? (
              <div style={{ color: '#95a5a6', fontSize: '12px' }}>No comments yet.</div>
            ) : (
              localComments.map(c => (
                <div className="comment-item" key={c.id}>
                  <span className="comment-user">{c.display_name || c.username}</span>
                  <span className="comment-text">{c.text}</span>
                  <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
          {currentUser ? (
            <form onSubmit={handleCommentSubmit} className="comment-input">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn btn-success btn-sm">
                <i className="fas fa-paper-plane"></i> Post
              </button>
            </form>
          ) : (
            <div style={{ color: '#95a5a6', fontSize: '12px' }}>Login to comment.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialActions;