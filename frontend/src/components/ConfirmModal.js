import React, { useEffect, useRef } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import './ConfirmModal.css';

function ConfirmModal({ isOpen, onClose, onConfirm, message, title = "Confirm Delete" }) {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="modal-content"
        ref={modalRef}
      >
        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button 
            className="confirm-button"
            onClick={onConfirm}
            autoFocus
          >
            <FaCheck /> Delete
          </button>
          <button 
            className="cancel-button"
            onClick={onClose}
          >
            <FaTimes /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
