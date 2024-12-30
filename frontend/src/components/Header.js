import React from 'react';
import { FaBars, FaProjectDiagram } from 'react-icons/fa';
import './Header.css';

function Header({ 
  onToggleLeftMenu, 
  onToggleGraphView,
  isLeftMenuVisible,
  isGraphViewVisible 
}) {
  return (
    <div className="header">
      <div className="header-left">
        <button 
          className={`toggle-button ${!isLeftMenuVisible ? 'active' : ''}`}
          onClick={onToggleLeftMenu}
          title="Toggle sidebar"
        >
          <FaBars />
          <span className="button-text">
            {isLeftMenuVisible ? 'Hide Menu' : 'Show Menu'}
          </span>
        </button>
        <div className="app-title">Chat Graph</div>
      </div>
      <div className="header-right">
        <button 
          className={`toggle-button ${!isGraphViewVisible ? 'active' : ''}`}
          onClick={onToggleGraphView}
          title="Toggle graph view"
        >
          <FaProjectDiagram />
          <span className="button-text">
            {isGraphViewVisible ? 'Hide Graph' : 'Show Graph'}
          </span>
        </button>
      </div>
    </div>
  );
}

export default Header;
