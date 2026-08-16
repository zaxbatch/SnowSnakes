import React, { useState } from 'react';
import api from '../api';

const SocialActions = ({ contentType, contentId, likes = 0, comments = [], shares = 0, currentUser, onUpdate }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localLikes, setLocalLikes] = useState(likes);
  const [localShares, setLocalShares] = useState(shares);
  const [localComments, setLocalComments] = useState(comments);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setLocalLikes(likes);
    setLocalShares(shares);
    setLocalComments(comments);
    if (currentUser && comments.some(c => c.user_id === currentUser.id)) {
      setIsLiked(true);
    } else {
      setIsLiked(false);
    }
  }, [likes, shares, comments, currentUser]);

  const handleLike = async () => {
    if (!currentUser) { alert('Please login to like'); return; }
    setIsLoading(true);
    try {
      const res = await api.post(`/${contentType}s/${contentId}/like`);
      setIsLiked(res.data.liked);
      setLocalLikes(res.data.liked ? localLikes + 1 : localLikes - 1);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error liking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!currentUser) { alert('Please login to share'); return; }
    setIsLoading(true);
    try {
      await api.post(`/${contentType}s/${contentId}/share`);
      setLocalShares(localShares + 1);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error sharing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { alert('Please login to comment'); return; }
    if (!commentText.trim()) return;
    setIsLoading(true);
    try {
      const res = await api.post(`/${contentType}s/${contentId}/comment`, { text: commentText });
      setLocalComments([res.data, ...localComments]);
      setCommentText('');
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Error posting comment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="social-actions">
        <button className={`btn btn-like btn-sm ${isLiked ? 'liked' : ''}`} onClick={handleLike} disabled={isLoading}>
          <i className="fas fa-heart"></i> {localLikes}
        </button>
        <button className="btn btn-comment btn-sm" onClick={() => setShowComments(!showComments)} disabled={isLoading}>
          <i className="fas fa-comment"></i> {localComments.length}
        </button>
        <button className="btn btn-share btn-sm" onClick={handleShare} disabled={isLoading}>
          <i className="fas fa-share"></i> {localShares}
        </button>
      </div>

      {showComments && (
        <div className="comments-section open">
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
              <input type="text" placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
              <button type="submit" className="btn btn-success btn-sm" disabled={isLoading}>
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