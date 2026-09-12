import React, { useState, useEffect } from 'react';
import api from '../api';

const SocialActions = ({ 
  contentType, 
  contentId, 
  likes = 0, 
  shares = 0, 
  commentCount = 0,
  currentUser, 
  onUpdate, 
  onOpenCommentModal,
  onShare,
}) => {
  const [localLikes, setLocalLikes] = useState(likes);
  const [localShares, setLocalShares] = useState(shares);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalLikes(likes);
    setLocalShares(shares);
  }, [likes, shares]);

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

  // Sharing counts the share AND opens the link panel. The count request is
  // deliberately not awaited: producing the link must never wait on the
  // network, and the count does not change what the visitor sees.
  const handleShare = () => {
    setLocalShares(localShares + 1);
    api.post(`/${contentType}s/${contentId}/share`).catch(() => {
      // A failed count is not worth interrupting a share for.
    });
    if (onShare) onShare();
  };

  return (
    <div className="social-actions">
      <button
        className={`btn btn-like btn-sm ${isLiked ? 'liked' : ''}`}
        onClick={handleLike}
        disabled={isLoading}
      >
        <i className="fas fa-heart"></i> {localLikes}
      </button>
      <button
        className="btn btn-comment btn-sm"
        onClick={() => onOpenCommentModal && onOpenCommentModal()}
        disabled={isLoading}
      >
        <i className="fas fa-comment"></i> {commentCount}
      </button>
      <button
        className="btn btn-share btn-sm"
        onClick={handleShare}
        disabled={isLoading}
        title="Share a direct link to this post"
      >
        <i className="fas fa-share"></i> {localShares}
      </button>
    </div>
  );
};

export default SocialActions;
