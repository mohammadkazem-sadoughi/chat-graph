import React, { useState } from 'react';
import './LeftMenu.css';
import ConfirmModal from './ConfirmModal';

function LeftMenu({ sessions, activeSessionId, setActiveSessionId, createNewSession, deleteSession, clearAllSessions }) {
  const [menuOpen, setMenuOpen] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState(null);

  const handleMenuClick = (e, sessionId) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === sessionId ? null : sessionId);
  };

  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation();
    setPendingDeleteSessionId(sessionId);
    setIsConfirmModalOpen(true);
    setMenuOpen(null);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteSessionId) {
      deleteSession(pendingDeleteSessionId);
    } else {
      clearAllSessions();
    }
    setIsConfirmModalOpen(false);
    setMenuOpen(null);
  };

  const handleClearAllClick = () => {
    setIsConfirmModalOpen(true);
    setPendingDeleteSessionId(null);
  };

  return (
    <div className='left-menu'>
      <div className="left-menu-header">
        <h2>Sessions</h2>
        <button className="new-session-icon-button" onClick={createNewSession} title="New chat">
          <i className="fas fa-plus"></i>
        </button>
      </div>
      <ul>
        {sessions.map((session) => (
          <li 
            key={session.session_id}
            onClick={() => setActiveSessionId(session.session_id)}
            className={session.session_id === activeSessionId ? 'active-session' : ''}
          >
            <span>{session.session_name || `Session ${session.session_id.slice(0, 8)}...`}</span>
            <div className="session-menu">
              <button 
                className="session-menu-button"
                onClick={(e) => handleMenuClick(e, session.session_id)}
                title="Session options"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              {menuOpen === session.session_id && (
                <div className="session-menu-options">
                  <button onClick={(e) => handleDeleteClick(e, session.session_id)} title="Delete session">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {sessions.length > 0 && (
        <>
          <button onClick={handleClearAllClick} className="clear-all-button" title="Clear all sessions">
            <i className="fas fa-trash-alt"></i> Clear All
          </button>
          {/* Add Spacer Block */}
          <div className="spacer"></div>
        </>
      )}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message={pendingDeleteSessionId ? "Are you sure you want to delete this session?" : "Are you sure you want to clear all sessions?"}
      />
    </div>
  );
}

export default LeftMenu;
