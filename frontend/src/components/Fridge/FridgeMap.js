import React, { useEffect, useState } from 'react';
import api from '../../api';

const FridgeMap = () => {
  const [fridge, setFridge] = useState({});

  useEffect(() => {
    api.get('/fridge')
      .then(res => setFridge(res.data))
      .catch(err => console.error(err));
  }, []);

  // Convert to shelf arrays
  const shelves = Object.keys(fridge).sort((a, b) => b - a);

  return (
    <div className="panel active">
      <div className="section-header" style={{ background: 'linear-gradient(135deg, #1a2a3a, #2c3e50)' }}>
        <span className="section-icon">🧊</span>
        <h2>THE FRIDGE</h2>
        <p>Where condiments live their best lives</p>
      </div>
      <div className="fridge">
        {shelves.map(shelf => (
          <div className="shelf" key={shelf}>
            <span className="shelf-label">SHELF {shelf}</span>
            {fridge[shelf].length > 0 ? (
              fridge[shelf].map(item => (
                <div className="fridge-item" key={item.character_id}>
                  <span className="condiment">{item.condiment}</span>
                  {item.name}
                  <span className="ethnicity-tag">{item.ethnicity}</span>
                </div>
              ))
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Empty shelf</span>
            )}
          </div>
        ))}
        {shelves.length === 0 && <p style={{ color: '#fff', textAlign: 'center' }}>The fridge is empty.</p>}
      </div>
    </div>
  );
};

export default FridgeMap;