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
    <div className='fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-8 sm:p-4'>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 w-full max-w-md max-h-[85vh] sm:max-h-[90vh] rounded-3xl bg-white shadow-xl transition-all duration-300 ease-out overflow-hidden ${
          isVisible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:translate-y-0 sm:opacity-0 sm:scale-95'
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
            className='absolute top-4 right-4 z-10 p-2 text-gray-400 transition-colors hover:text-gray-600 hover:bg-gray-100 rounded-full'
          >
            <X className='h-5 w-5' />
          </button>
        )}
        <div className={`overflow-y-auto ${title ? 'p-4 sm:p-6 max-h-[calc(85vh-80px)] sm:max-h-[calc(90vh-80px)]' : 'p-4 sm:p-6 pt-12 sm:pt-14 max-h-[85vh] sm:max-h-[90vh]'}`}>{children}</div>
      </div>
    </div>
  );
}
