import React, { useEffect, useState, useContext } from 'react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import JokeCard from './JokeCard';

const JokeList = () => {
  const [jokes, setJokes] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const { user } = useContext(AuthContext);

  const fetchJokes = async () => {
    try {
      const res = await api.get('/jokes', { params: { search, sort } });
      setJokes(res.data);
    } catch (err) {
      console.error('Failed to fetch jokes:', err);
    }
  };

  useEffect(() => {
    fetchJokes();
  }, [search, sort]);

  const handleLike = async (id) => {
    try {
      await api.post(`/jokes/${id}/like`);
      fetchJokes();
    } catch (err) {
      alert('Please login to like jokes');
    }
  };

  const handleShare = async (id) => {
    try {
      await api.post(`/jokes/${id}/share`);
      fetchJokes();
    } catch (err) {
      alert('Failed to share');
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
        fetchJokes();
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
      <div className="flex justify-between align-center mb-20">
        <input
          type="text"
          placeholder="Search jokes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-control"
          style={{ width: '200px' }}
        />
        <div className="flex gap-10">
          <button className="btn btn-secondary" onClick={() => setSort('likes')}>MOST LIKED</button>
          <button className="btn btn-secondary" onClick={() => setSort('newest')}>NEWEST</button>
          <button className="btn btn-secondary" onClick={() => setSort('oldest')}>OLDEST</button>
        </div>
      </div>
      <div className="grid-2">
        {jokes.map(joke => (
          <JokeCard
            key={`${joke.id}-${joke.kill_count}`} // ✅ Force re-render when kill_count changes
            joke={joke}
            onLike={handleLike}
            onShare={handleShare}
            onKill={handleKill}
            onDelete={handleDelete}
            onComment={handleComment}
            currentUser={user}
          />
        ))}
      </div>
    </div>
  );
};

export default JokeList;