import React, { useState } from 'react';
import './App.css';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import ControlsPage from './components/ControlsPage';
import SettingsPage from './components/SettingsPage';
import MusicToggle from './components/MusicToggle';
import audioManager from './utils/audioManager';

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'game', 'controls', 'settings'

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onStart={() => {
          audioManager.stopBackgroundMusic();
          setCurrentPage('game');
        }} onControls={() => setCurrentPage('controls')} onSettings={() => setCurrentPage('settings')} />;
      case 'game':
        return <GamePage onBack={() => {
          // 重新開始選單音樂
          audioManager.playBackgroundMusic('menu');
          setCurrentPage('home');
        }} />;
      case 'controls':
        return <ControlsPage onBack={() => setCurrentPage('home')} />;
      case 'settings':
        return <SettingsPage onBack={() => setCurrentPage('home')} />;
      default:
        return <HomePage onStart={() => {
          audioManager.stopBackgroundMusic();
          setCurrentPage('game');
        }} onControls={() => setCurrentPage('controls')} onSettings={() => setCurrentPage('settings')} />;
    }
  };

  return (
    <div className="App">
      <MusicToggle />
      {renderPage()}
    </div>
  );
}

export default App;
