import React, { useState, useEffect } from 'react';
import api from '../api';

const SocialActions = ({ 
  contentType, 
  contentId, 
  likes = 0, 
  shares = 0, 
  commentCount = 0,
  isLiked: isLikedProp = false,
  currentUser, 
  onUpdate, 
  onOpenCommentModal,
  onShare,
}) => {
  const [localLikes, setLocalLikes] = useState(likes);
  const [localShares, setLocalShares] = useState(shares);
  // Seeded from the server's flag, so an item that is already liked shows a
  // filled heart on load. This used to start false unconditionally, which is
  // why the heart only ever lit up on the item you had just clicked.
  const [isLiked, setIsLiked] = useState(!!isLikedProp);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalLikes(likes);
    setLocalShares(shares);
  }, [likes, shares]);

  useEffect(() => {
    setIsLiked(!!isLikedProp);
  }, [isLikedProp]);

  const handleLike = async () => {
    if (!currentUser) { alert('Please login to like'); return; }

    // Optimistic: the heart and the count move on click, then the request goes
    // out, and both are rolled back if it fails. The gallery list is not
    // refetched — that reload is what made liking feel like a page refresh.
    const nextLiked = !isLiked;
    const previousLikes = localLikes;
    setIsLiked(nextLiked);
    setLocalLikes(nextLiked ? localLikes + 1 : Math.max(0, localLikes - 1));
    setIsLoading(true);

    try {
      const res = await api.post(`/${contentType}s/${contentId}/like`);
      // Trust the server if it disagrees with what was assumed.
      const settled = res.data && typeof res.data.liked === 'boolean' ? res.data.liked : nextLiked;
      if (settled !== nextLiked) setIsLiked(settled);
      // Tell the parent so its item data stays in step. This must be an
      // in-place update, never a refetch.
      if (onUpdate) onUpdate(settled);
    } catch (err) {
      setIsLiked(!nextLiked);
      setLocalLikes(previousLikes);
      alert('Error liking — please try again');
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
