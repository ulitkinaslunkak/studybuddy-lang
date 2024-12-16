import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; 

function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  return (
    <div className={`navbar ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="navbar-container">
        <h1 className="navbar-title">StudyBuddy Lang</h1>
        <nav className="navbar-links">
          <Link to="/main" className="navbar-link">Главная</Link>
          <Link to="/" className="navbar-link">Уроки</Link>
          <Link to="/profile" className="navbar-link">Профиль</Link>
        </nav>
        {/* Кнопка для переключения темы */}
        <button onClick={toggleTheme} className="theme-toggle-btn">
          {isDarkMode ? 'Светлая тема' : 'Темная тема'}
        </button>
      </div>
    </div>
  );
}

export default Navbar;