import React, { useState } from 'react';
import api from '../../api';

const Randomizer = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRandom = async () => {
    setLoading(true);
    try {
      const res = await api.get('/random');
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch random items');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel active">
      <div className="randomizer-display" style={{ background: '#ffffcc', border: '4px dashed #ff00ff', borderRadius: 30, padding: 40 }}>
        <span className="big-emoji" style={{ fontSize: 100, display: 'block', marginBottom: 15 }}>🐍</span>
        <h1 style={{ color: '#ff00ff', fontFamily: "'Comic Sans MS', cursive" }}>RANDOM SNOW SNAKE</h1>
        <p style={{ color: '#003399', fontWeight: 'bold' }}>CLICK THE BUTTON AND LET THE SNOW SNAKE CHOOSE YOUR FATE!</p>
        <button className="btn btn-primary mt-20" onClick={fetchRandom} style={{ fontSize: 24, padding: '15px 40px' }}>
          <i className="fas fa-dice"></i> {loading ? 'SUMMONING...' : 'SUMMON!'}
        </button>
        {result && (
          <div style={{ marginTop: 30 }}>
            <div className="card" style={{ background: '#fff', border: '4px solid #ff00ff', textAlign: 'left', padding: 20 }}>
              <div><strong>😂 Joke:</strong> {result.joke?.content || 'N/A'}</div>
              <div><strong>🎨 Doodle:</strong> {result.doodle?.title || 'N/A'}</div>
              <div><strong>📢 Comic:</strong> {result.comic?.title || 'N/A'}</div>
              <div><strong>🎬 Episode:</strong> {result.episode?.title || 'N/A'}</div>
              <div><strong>🎮 Game:</strong> {result.game?.title || 'N/A'}</div>
              <div><strong>🌭 Character:</strong> {result.character?.name || 'N/A'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Randomizer;