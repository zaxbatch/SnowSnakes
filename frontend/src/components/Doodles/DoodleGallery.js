import React, { useEffect, useState } from 'react';
import api from '../../api';

const DoodleGallery = () => {
  const [doodles, setDoodles] = useState([]);

  useEffect(() => {
    api.get('/doodles')
      .then(res => setDoodles(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #00cc66, #00ff99)' }}>
        <span className="section-icon">🎨</span>
        <h2>DOODLE GALLERY</h2>
        <p>Where art meets condiments</p>
      </div>
      <div className="grid-3">
        {doodles.map(d => (
          <div className="doodle-card" key={d.id}>
            {d.image_url && d.image_url.startsWith('http') ? (
              <img 
                src={d.image_url} 
                alt={d.title} 
                style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain' }} 
              />
            ) : (
              <span className="doodle-art" style={{ fontSize: 60 }}>{d.image_url || '🎨'}</span>
            )}
            <div className="card-title">{d.title}</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {d.joke_content ? `😂 "${d.joke_content.substring(0, 30)}..."` : ''}
              {d.character_name ? `🧑 ${d.character_name}` : ''}
            </div>
          </div>
        ))}
        {doodles.length === 0 && <p>No doodles yet.</p>}
      </div>
    </div>
  );
};

export default DoodleGallery;