import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CircleCheck, CircleAlert, X } from 'lucide-react';

const ToastContext = createContext();

let nextToastId = 1;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message) => {
    const id = nextToastId++;
    setToasts((prev) => {
      const next = [...prev, { id, type, message }];
      if (next.length > 3) {
        const dropped = next[0];
        if (timersRef.current[dropped.id]) {
          clearTimeout(timersRef.current[dropped.id]);
          delete timersRef.current[dropped.id];
        }
        return next.slice(-3);
      }
      return next;
    });

    timersRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((message) => {
    addToast('success', message);
  }, [addToast]);

  const error = useCallback((message) => {
    addToast('error', message);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ success, error }}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-50 flex flex-col gap-2 print:hidden inset-x-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] md:inset-x-auto md:right-6 md:bottom-6 md:w-96"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-start gap-3 rounded-lg border border-line bg-surface p-3 shadow-lg"
          >
            {toast.type === 'success' ? (
              <CircleCheck size={18} className="text-success mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <CircleAlert size={18} className="text-danger mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <div className="text-sm text-ink flex-1">{toast.message}</div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss"
              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink transition-colors"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
