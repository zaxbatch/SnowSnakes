import React, { useEffect, useState, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import JokeCard from './JokeCard';
import ShareModal from '../ShareModal';
import LoadingSkeleton, { LoadError } from '../LoadingSkeleton';
import useDeepLink from '../../utils/useDeepLink';

const JokeList = () => {
  const [jokes, setJokes] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [popular, setPopular] = useState(null);
  const { user } = useContext(AuthContext);

  // Arriving from a shared /jokes?joke=123 link.
  useDeepLink('joke', jokes, loading);

  const fetchJokes = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get('/jokes', { params: { search, sort } });
      setJokes(res.data);
    } catch (err) {
      console.error('Failed to fetch jokes:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJokes();
  }, [search, sort]);

  // Fetched lazily: the suggestion only matters if someone actually shares, and
  // the gallery should not pay for an extra request on every page load.
  const openShare = async (joke) => {
    setShareTarget(joke);
    // Count it here rather than in the card: sharing a link needs no login.
    const current = jokes.find((j) => j.id === joke.id);
    if (current) {
      setJokes((prev) => prev.map((j) => (j.id === joke.id ? { ...j, shares: (j.shares || 0) + 1 } : j)));
    }
    api.post(`/jokes/${joke.id}/share`).catch(() => {});
    if (popular === null) {
      try {
        const res = await api.get('/jokes', { params: { sort: 'likes' } });
        const top = res.data && res.data[0];
        if (top && top.id !== joke.id) {
          setPopular({ contentType: 'joke', id: top.id, title: top.content });
        } else {
          setPopular(false);
        }
      } catch (err) {
        setPopular(false);
      }
    }
  };

  // Optimistic, and the list is never refetched: reloading the whole gallery
  // for one heart is what made liking feel like a page refresh.
  const handleLike = async (id) => {
    const joke = jokes.find((j) => j.id === id);
    if (!joke) return;
    if (!user) { alert('Please login to like jokes'); return; }

    const previous = { liked: !!joke.isLiked, likes: joke.likes || 0 };
    const nextLiked = !previous.liked;

    const paint = (liked, likes) => setJokes((prev) => prev.map((j) => (
      j.id === id ? { ...j, isLiked: liked, likes } : j
    )));

    paint(nextLiked, nextLiked ? previous.likes + 1 : Math.max(0, previous.likes - 1));

    try {
      const res = await api.post(`/jokes/${id}/like`);
      const settled = res.data && typeof res.data.liked === 'boolean' ? res.data.liked : nextLiked;
      if (settled !== nextLiked) paint(settled, settled ? previous.likes + 1 : previous.likes);
    } catch (err) {
      paint(previous.liked, previous.likes);
      alert('Error liking — please try again');
    }
  };

  const handleKill = async (id) => {
    // Find current joke to get the current kill count
    const currentJoke = jokes.find(j => j.id === id);
    if (!currentJoke) return;

    // Optimistic update – increment immediately in UI
    const newCount = (currentJoke.kill_count || 0) + 1;
    setJokes(prev =>
      prev.map(joke =>
        joke.id === id
          ? { ...joke, kill_count: newCount }
          : joke
      )
    );

    try {
      await api.post(`/jokes/${id}/kill`);
      // Optionally sync with server (but we already updated optimistically)
      // Uncomment the line below if you want to ensure sync after server response
      // await fetchJokes();
    } catch (err) {
      console.error('Kill error:', err);
      // Rollback on failure
      setJokes(prev =>
        prev.map(joke =>
          joke.id === id
            ? { ...joke, kill_count: (joke.kill_count || 0) - 1 }
            : joke
        )
      );
      alert('Failed to kill joke');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this joke?')) {
      try {
        await api.delete(`/jokes/${id}`);
        // Remove in place — no full refetch, so the list updates instantly.
        setJokes((prev) => prev.filter((j) => j.id !== id));
      } catch (err) {
        alert('Failed to delete');
      }
    }
  };

  const handleComment = async (id, text) => {
    try {
      await api.post(`/jokes/${id}/comment`, { text });
      fetchJokes();
    } catch (err) {
      alert('Please login to comment');
    }
  };

  return (
    <div>
      <div className="flex justify-between align-center mb-20 sort-bar">
        <input
          type="text"
          placeholder="Search jokes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control search-input"
        />
        <div className="flex gap-10 sort-options">
          <button className="btn btn-secondary" onClick={() => setSort('likes')}>MOST LIKED</button>
          <button className="btn btn-secondary" onClick={() => setSort('newest')}>NEWEST</button>
          <button className="btn btn-secondary" onClick={() => setSort('oldest')}>OLDEST</button>
        </div>
      </div>
      {loading ? (
        <LoadingSkeleton variant="joke" count={6} gridClass="grid-2" message="Loading dad jokes…" />
      ) : error ? (
        <LoadError message="Couldn't load the jokes." onRetry={fetchJokes} />
      ) : jokes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">😂</span>
          <p>No jokes here yet — be the first to submit one!</p>
        </div>
      ) : (
        <div className="grid-2">
          {jokes.map(joke => (
            <JokeCard
              key={`${joke.id}-${joke.kill_count}`} // ✅ Force re-render when kill_count changes
              joke={joke}
              onLike={handleLike}
              onKill={handleKill}
              onDelete={handleDelete}
              onComment={handleComment}
              currentUser={user}
              onOpenShare={openShare}
            />
          ))}
        </div>
      )}

      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        contentType="joke"
        contentId={shareTarget && shareTarget.id}
        title={shareTarget && shareTarget.content}
        subtitle={shareTarget && shareTarget.series}
        popular={popular || null}
      />
    </div>
  );
};

export default JokeList;