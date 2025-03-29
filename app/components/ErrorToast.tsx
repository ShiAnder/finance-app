import React from 'react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in-up">
      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
        <span className="text-white text-sm">!</span>
      </div>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-4 text-red-700 hover:text-red-900"
      >
        ×
      </button>
    </div>
  );
};