import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Nav = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const isAdmin = user && user.is_admin;

  // Base tabs for all users
  const baseTabs = [
    { name: 'HOME', path: '/' },
    { name: 'DAD JOKES', path: '/jokes' },
    { name: 'DOODLES', path: '/doodles' },
    { name: 'SONGS', path: '/songs' },
    { name: 'GAMES', path: '/games' },
    { name: 'SPREAD DA WORD', path: '/spread' },
    { name: 'RANDOMIZER', path: '/randomizer' },
  ];

  // Add Admin tab if user is admin
  const tabs = isAdmin
    ? [...baseTabs, { name: '🛡️ ADMIN', path: '/admin' }]
    : baseTabs;

  return (
    <nav className="nav-tabs">
      {tabs.map(tab => (
        <Link
          key={tab.path}
          to={tab.path}
          // Exact match for the gallery itself, prefix match for its detail
          // pages (/jokes/42 keeps the Dad Jokes tab lit). "/" only matches "/"
          // so the Home tab does not light up everywhere.
          className={`nav-tab ${
            location.pathname === tab.path ||
            (tab.path !== '/' && location.pathname.startsWith(tab.path + '/'))
              ? 'active' : ''
          }`}
        >
          {tab.name}
        </Link>
      ))}
    </nav>
  );
};

export default Nav;