import React, { useEffect, useState } from 'react';
import api from '../../api';

const CharacterList = () => {
  const [characters, setCharacters] = useState([]);

  useEffect(() => {
    api.get('/characters')
      .then(res => setCharacters(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #8e44ad, #3498db)' }}>
        <span className="section-icon">🌭</span>
        <h2>CHARACTERS</h2>
        <p>The condiment universe</p>
      </div>
      <div className="grid-4">
        {characters.map(c => (
          <div className="card" key={c.id} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>{c.condiment}</div>
            <div className="card-title">{c.name}</div>
            <div style={{ fontSize: 14, color: '#003399' }}>{c.ethnicity}</div>
            <div style={{ fontStyle: 'italic', fontSize: 13, marginTop: 8 }}>"{c.catchphrase}"</div>
            <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 8 }}>
              Location: {c.location || 'hood'}
              {c.used_up && ' (used up)'}
            </div>
          </div>
        ))}
        {characters.length === 0 && <p>No characters yet.</p>}
      </div>
    </div>
  );
};

export default CharacterList;