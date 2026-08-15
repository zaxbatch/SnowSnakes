import React, { useEffect, useState } from 'react';
import api from '../api';

const Home = () => {
  const [stats, setStats] = useState({ jokes: 0, doodles: 0, comics: 0, episodes: 0, games: 0 });

  useEffect(() => {
    // Fetch counts (you can create a /stats endpoint or just fetch lists)
    const fetchStats = async () => {
      try {
        const [jokes, doodles, comics, episodes, games] = await Promise.all([
          api.get('/jokes'),
          api.get('/doodles'),
          api.get('/comics'),
          api.get('/episodes'),
          api.get('/games'),
        ]);
        setStats({
          jokes: jokes.data.length,
          doodles: doodles.data.length,
          comics: comics.data.length,
          episodes: episodes.data.length,
          games: games.data.length,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="panel active" id="panel-home">
      <div style={{ textAlign: 'center', padding: '30px 0' }}>
        <div style={{ fontSize: '60px', animation: 'slither 3s infinite ease-in-out' }}>🐍</div>
        <h1 style={{ fontSize: '48px', color: '#003399', textShadow: '3px 3px 0 #ff00ff', fontFamily: "'Comic Sans MS', cursive" }}>
          WELCOME TO SNOWSNAKES!
        </h1>
        <p style={{ fontSize: '20px', color: '#003399', fontWeight: 'bold' }}>🌭 Where condiments live their best lives! 🧈</p>

        <div className="grid-5" style={{ maxWidth: '1200px', margin: '20px auto' }}>
          <div className="card" style={{ textAlign: 'center', background: '#ffccff', borderColor: '#ff00ff' }}>
            <div style={{ fontSize: '40px' }}>😂</div>
            <h3>{stats.jokes} Jokes</h3>
            <p style={{ color: '#003399' }}>Dad jokes that kill</p>
          </div>
          <div className="card" style={{ textAlign: 'center', background: '#ccffcc', borderColor: '#00ff00' }}>
            <div style={{ fontSize: '40px' }}>🎨</div>
            <h3>{stats.doodles} Doodles</h3>
            <p style={{ color: '#003399' }}>Art masterpieces</p>
          </div>
          <div className="card" style={{ textAlign: 'center', background: '#ccccff', borderColor: '#0000ff' }}>
            <div style={{ fontSize: '40px' }}>📢</div>
            <h3>{stats.comics} Comics</h3>
            <p style={{ color: '#003399' }}>User submitted</p>
          </div>
          <div className="card" style={{ textAlign: 'center', background: '#ffffcc', borderColor: '#ff9900' }}>
            <div style={{ fontSize: '40px' }}>🎬</div>
            <h3>{stats.episodes} Episodes</h3>
            <p style={{ color: '#003399' }}>Animated series</p>
          </div>
          <div className="card" style={{ textAlign: 'center', background: '#ccffcc', borderColor: '#00cc66' }}>
            <div style={{ fontSize: '40px' }}>🎮</div>
            <h3>{stats.games} Games</h3>
            <p style={{ color: '#003399' }}>User submitted</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;