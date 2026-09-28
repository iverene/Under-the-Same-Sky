import React from 'react';
import NightSky from './components/NightSky';
import SendPage from './components/SendPage';
import QRPage from './components/QRPage';

function App() {
  const path = window.location.pathname;

  if (path === '/send') return <SendPage />;
  if (path === '/qr') return <QRPage />;

  return (
    <div className="w-full h-screen overflow-hidden">
      <NightSky />
    </div>
  );
}

export default App;
