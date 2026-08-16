import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const FullscreenMediaModal = ({ isOpen, onClose, title, imageUrl, children, type = 'image' }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="game-play-modal active"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-box"
        style={{
          maxWidth: '1100px',
          width: '85vw',
          maxHeight: '85vh',
          height: '70vh',
          backgroundColor: '#fff',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#222',
            color: '#fff',
            padding: '10px 20px',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>{title}</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-warning btn-sm"
              onClick={toggleFullscreen}
              style={{ background: '#ffcc00', color: '#000' }}
            >
              <i className="fas fa-expand"></i> {isFullscreen ? 'EXIT' : 'FULLSCREEN'}
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={onClose}
              style={{ background: '#ff4444', color: '#fff' }}
            >
              <i className="fas fa-times"></i> CLOSE
            </button>
          </div>
        </div>
        <div
          ref={containerRef}
          style={{
            flex: 1,
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {type === 'image' && imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : type === 'comic' ? (
            <div style={{ padding: '20px', textAlign: 'center', maxWidth: '100%' }}>
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default FullscreenMediaModal;