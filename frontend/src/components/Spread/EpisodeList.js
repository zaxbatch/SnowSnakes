import React, { useEffect, useState } from 'react';
import api from '../../api';

const EpisodeList = () => {
  const [episodes, setEpisodes] = useState([]);

  useEffect(() => {
    api.get('/episodes')
      .then(res => setEpisodes(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #e67e22, #f39c12)' }}>
        <span className="section-icon">🎬</span>
        <h2>SPREAD DA WORD</h2>
        <p>The official Snowsnakes animated series — watch only!</p>
      </div>
      <div className="grid-spread">
        {episodes.map(ep => (
          <div className="spread-card" key={ep.id}>
            <div className="episode-badge">{ep.episode_number || 'SPECIAL'}</div>
            {ep.featured && <div className="episode-featured">⭐ FEATURED</div>}
            <h3 style={{ fontFamily: "'Comic Sans MS', cursive", color: '#e67e22' }}>{ep.title}</h3>
            <div className="spread-panel">
              <span className="scene">{ep.scene}</span>
              <div className="dialogue">"{ep.dialogue}"</div>
              <div className="caption">{ep.caption}</div>
            </div>
            <div className="spread-meta">
              <span className="episode-number">{ep.episode_number || 'SPECIAL'}</span>
              <span className="episode-date">📅 {ep.air_date || 'TBA'}</span>
            </div>
            <div className="spread-view-only">🎬 Official Episode — Watch Only</div>
          </div>
        ))}
        {episodes.length === 0 && <p>No episodes yet.</p>}
      </div>
    </div>
  );
};

export default EpisodeList;