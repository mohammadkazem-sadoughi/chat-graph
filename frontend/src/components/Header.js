import React from 'react';
import { FaBars, FaChartArea } from 'react-icons/fa';
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
        </button>
        <button 
          className={`toggle-button ${!isGraphViewVisible ? 'active' : ''}`}
          onClick={onToggleGraphView}
          title="Toggle graph view"
        >
          <FaChartArea />
        </button>
      </div>
      <div className="header-right">
        {/* Add any right-side header content here */}
      </div>
    </div>
  );
}

export default Header;
