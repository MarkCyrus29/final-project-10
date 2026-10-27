import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Button } from '../components/ui/Button';

const ConfirmContext = createContext();

export const ConfirmProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const resolverRef = useRef(null);
  const dialogRef = useRef(null);
  const cancelBtnRef = useRef(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfig({
        title: options.title || 'Are you sure?',
        description: options.description || '',
        confirmLabel: options.confirmText || options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        tone: options.variant || options.tone || 'default'
      });
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
        setTimeout(() => {
          cancelBtnRef.current?.focus();
        }, 0);
      }
    });
  }, []);

  const handleConfirm = () => {
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
    setConfig(null);
  };

  const handleCancel = () => {
    if (dialogRef.current && dialogRef.current.open) {
      dialogRef.current.close();
    }
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setConfig(null);
  };

  const handleDialogClick = (e) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      handleCancel();
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          handleCancel();
        }}
        onClick={handleDialogClick}
        className="fixed inset-0 m-auto h-fit w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-surface p-6 text-ink shadow-lg backdrop:bg-black/50"
      >
        {config && (
          <div>
            <h2 className="text-base font-semibold text-ink">{config.title}</h2>
            {config.description && (
              <p className="text-sm text-ink-muted mt-2">{config.description}</p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                ref={cancelBtnRef}
                type="button"
                variant="secondary"
                onClick={handleCancel}
              >
                {config.cancelLabel}
              </Button>
              <Button
                type="button"
                variant={config.tone === 'danger' ? 'danger' : 'primary'}
                onClick={handleConfirm}
              >
                {config.confirmLabel}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export default ConfirmContext;
