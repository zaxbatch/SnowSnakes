import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { name: 'HOME', path: '/' },
  { name: 'DAD JOKES', path: '/jokes' },
  { name: 'DOODLES', path: '/doodles' },
  { name: 'COMICS', path: '/comics' },
  { name: 'GAMES', path: '/games' },
  { name: 'SPREAD DA WORD', path: '/spread' },
  { name: 'RANDOMIZER', path: '/randomizer' },
];

const Nav = () => {
  const location = useLocation();

  return (
    <nav className="nav-tabs">
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          className={`nav-tab ${location.pathname === tab.path ? 'active' : ''}`}
        >
          {tab.name}
        </Link>
      ))}
    </nav>
  );
};

export default Nav;