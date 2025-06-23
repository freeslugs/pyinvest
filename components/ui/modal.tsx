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
      // Wait for animation to complete before removing from DOM (match CSS duration)
      setTimeout(() => setShouldRender(false), 300);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center p-4 pb-8 sm:items-center sm:p-4'>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 max-h-[85vh] w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-300 ease-out sm:max-h-[90vh] ${
          isVisible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95 sm:opacity-0'
        }`}
      >
        {title ? (
          <div className='flex items-center justify-between border-b border-gray-200 p-4 sm:p-6'>
            <h2 className='text-lg font-semibold text-gray-900'>{title}</h2>
            <button
              onClick={onClose}
              className='p-1 text-gray-400 transition-colors hover:text-gray-600'
            >
              <X className='h-5 w-5' />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className='absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'
          >
            <X className='h-5 w-5' />
          </button>
        )}
        <div
          className={`overflow-y-auto ${title ? 'max-h-[calc(85vh-80px)] p-4 sm:max-h-[calc(90vh-80px)] sm:p-6' : 'max-h-[85vh] p-4 pt-12 sm:max-h-[90vh] sm:p-6 sm:pt-14'}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
