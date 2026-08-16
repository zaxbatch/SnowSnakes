import React, { useState } from 'react';

const SnowSnakeEasterEgg = () => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount === 3) {
      alert('🐍 YOU FOUND THE SNOW SNAKE!');
    } else if (newCount === 5) {
      alert('🌭 WHY DID THE SNOW SNAKE CROSS THE ROAD?\nTO GET TO THE OTHER CONDIMENT!');
      setClickCount(0);
    }
  };

  return (
    <div
      className="snow-snake-easter"
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        opacity: 0.2,
        fontSize: '40px',
        transition: 'all 0.5s ease',
        cursor: 'pointer',
        zIndex: 100,
        fontFamily: "'Comic Sans MS', cursive",
        textAlign: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'scale(1.3) rotate(360deg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.2';
        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
      }}
    >
      🐍
      <span className="label" style={{ fontSize: '9px', display: 'block', color: '#ff00ff', fontWeight: 900 }}>
        ★ CLICK ME ★
      </span>
    </div>
  );
};

export default SnowSnakeEasterEgg;