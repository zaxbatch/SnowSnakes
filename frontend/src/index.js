import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/App.css'; // we'll put your CSS here later

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);