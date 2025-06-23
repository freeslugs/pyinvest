import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure the element is rendered before animating
      setTimeout(() => setIsVisible(true), 10);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      // Wait for animation to complete before removing from DOM
      setTimeout(() => setShouldRender(false), 200);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-200 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 mx-4 w-full max-w-md rounded-3xl bg-white shadow-xl transition-all duration-200 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className='flex items-center justify-between border-b border-gray-200 p-6'>
          <h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
          <button
            onClick={onClose}
            className='p-1 text-gray-400 transition-colors hover:text-gray-600'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
        <div className='p-6'>{children}</div>
      </div>
    </div>
  );
}
