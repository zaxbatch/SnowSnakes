import React, { useEffect, useState } from 'react';
import api from '../../api';
import FullscreenMediaModal from '../FullscreenMediaModal';

const DoodleGallery = () => {
  const [doodles, setDoodles] = useState([]);
  const [selectedDoodle, setSelectedDoodle] = useState(null);

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
                style={{ maxWidth: '100%', maxHeight: '150px', objectFit: 'contain', cursor: 'pointer' }}
                onClick={() => setSelectedDoodle(d)}
              />
            ) : (
              <span className="doodle-art" style={{ fontSize: 60, cursor: 'pointer' }} onClick={() => setSelectedDoodle(d)}>
                {d.image_url || '🎨'}
              </span>
            )}
            <div className="card-title">{d.title}</div>
            <button className="btn btn-primary btn-sm" onClick={() => setSelectedDoodle(d)}>
              <i className="fas fa-expand"></i> Expand
            </button>
          </div>
        ))}
        {doodles.length === 0 && <p>No doodles yet.</p>}
      </div>

      {selectedDoodle && (
        <FullscreenMediaModal
          isOpen={!!selectedDoodle}
          onClose={() => setSelectedDoodle(null)}
          title={selectedDoodle.title}
          imageUrl={selectedDoodle.image_url && selectedDoodle.image_url.startsWith('http') ? selectedDoodle.image_url : null}
          type="image"
        />
      )}
    </div>
  );
};

export default DoodleGallery;