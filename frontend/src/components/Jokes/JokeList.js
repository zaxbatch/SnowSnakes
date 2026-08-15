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
    const res = await api.get('/jokes', { params: { search, sort } });
    setJokes(res.data);
  };

  useEffect(() => {
    fetchJokes();
  }, [search, sort]);

  const handleLike = async (id) => {
    await api.post(`/jokes/${id}/like`);
    fetchJokes();
  };

  const handleShare = async (id) => {
    await api.post(`/jokes/${id}/share`);
    fetchJokes();
  };

  const handleKill = async (id) => {
    await api.post(`/jokes/${id}/kill`);
    fetchJokes();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) {
      await api.delete(`/jokes/${id}`);
      fetchJokes();
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
            key={joke.id}
            joke={joke}
            onLike={handleLike}
            onShare={handleShare}
            onKill={handleKill}
            onDelete={handleDelete}
            currentUser={user}
          />
        ))}
      </div>
    </div>
  );
};

export default JokeList;