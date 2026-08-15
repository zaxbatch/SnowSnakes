import React, { useEffect, useState } from 'react';
import api from '../../api';

const ComicList = () => {
  const [comics, setComics] = useState([]);

  useEffect(() => {
    api.get('/comics')
      .then(res => setComics(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }}>
        <span className="section-icon">📢</span>
        <h2>COMICS</h2>
        <p>User-submitted comics from the condiment universe</p>
      </div>
      <div className="grid-comics">
        {comics.map(c => (
          <div className="comic-card" key={c.id}>
            <h3 style={{ fontFamily: "'Comic Sans MS', cursive", color: '#660099' }}>{c.title}</h3>
            <div className="comic-panel">
              <span className="scene">{c.scene}</span>
              <div className="dialogue">"{c.dialogue}"</div>
              <div className="caption">{c.caption}</div>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>✏️ By {c.author_name || 'anonymous'}</div>
          </div>
        ))}
        {comics.length === 0 && <p>No comics yet.</p>}
      </div>
    </div>
  );
};

export default ComicList;