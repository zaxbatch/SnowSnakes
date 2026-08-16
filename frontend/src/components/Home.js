import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    jokes: 0,
    doodles: 0,
    comics: 0,
    episodes: 0,
    games: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [jokesRes, doodlesRes, comicsRes, episodesRes, gamesRes] = await Promise.all([
          api.get('/jokes'),
          api.get('/doodles'),
          api.get('/comics'),
          api.get('/episodes'),
          api.get('/games'),
        ]);
        setStats({
          jokes: jokesRes.data.length,
          doodles: doodlesRes.data.length,
          comics: comicsRes.data.length,
          episodes: episodesRes.data.length,
          games: gamesRes.data.length,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const statItems = [
    { key: 'jokes', label: 'Jokes', emoji: '😂', path: '/jokes', color: '#ffccff' },
    { key: 'doodles', label: 'Doodles', emoji: '🎨', path: '/doodles', color: '#ccffcc' },
    { key: 'comics', label: 'Comics', emoji: '📢', path: '/comics', color: '#ccccff' },
    { key: 'episodes', label: 'Episodes', emoji: '🎬', path: '/spread', color: '#ffffcc' },
    { key: 'games', label: 'Games', emoji: '🎮', path: '/games', color: '#ccffcc' },
  ];

  return (
    <div className="panel active" id="panel-home">
      <div style={{ textAlign: 'center', padding: '30px 0' }}>
        <div style={{ fontSize: '60px', animation: 'slither 3s infinite ease-in-out' }}>🐍</div>
        <h1 style={{ fontSize: '48px', color: '#003399', textShadow: '3px 3px 0 #ff00ff', fontFamily: "'Comic Sans MS', cursive" }}>
          WELCOME TO SNOWSNAKES!
        </h1>
        <p style={{ fontSize: '20px', color: '#003399', fontWeight: 'bold' }}>🌭 Where condiments live their best lives! 🧈</p>

        <div className="grid-5" style={{ maxWidth: '1200px', margin: '20px auto' }}>
          {statItems.map((item) => (
            <div
              key={item.key}
              className="card"
              style={{
                textAlign: 'center',
                background: item.color,
                borderColor: '#ff00ff',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: '40px' }}>{item.emoji}</div>
              <h3>{stats[item.key]} {item.label}</h3>
              <p style={{ color: '#003399' }}>Click to explore</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#ffffcc', border: '3px solid #ff00ff', padding: '10px', borderRadius: '15px', margin: '15px auto', maxWidth: '500px' }}>
          <span style={{ fontWeight: '700', color: '#003399' }}>🎮 NEW!</span>
          <span style={{ color: '#666' }}>Submit your own mini-games and get featured!</span>
        </div>

        <marquee behavior="scroll" direction="right" scrollamount="3" style={{ color: '#ff6600', fontWeight: 'bold' }}>
          🐍 Why don't snow snakes eat? They're cold-blooded! ❄️
        </marquee>

        <button
          className="btn btn-primary"
          style={{ marginTop: '20px', fontSize: '24px' }}
          onClick={() => navigate('/randomizer')}
        >
          <i className="fas fa-dice"></i> FEELIN' LUCKY?
        </button>
      </div>
    </div>
  );
};

export default Home;