// components/Modal.js
import React from 'react';
import styles from '../styles';

const Modal = ({ title, children, onClose, hasCloseButton = true }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Modal overlay - changed from transparent to semi-opaque black */}
      <div 
        className="fixed inset-0 bg-black opacity-80" 
        onClick={onClose}
      ></div>
      
      {/* Modal content - added solid background color */}
      <div className="relative z-10 p-6 rounded-lg bg-[#13131a] border border-siteViolet shadow-lg w-[90%] md:w-[60%] max-w-[500px]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-xl font-bold">{title}</h3>
          {hasCloseButton && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;