import React, { useEffect, useId, useRef } from 'react';

const ACCENTS = {
  blue: {
    border: 'border-blue-400/30 shadow-blue-900/30',
    glow: 'from-blue-500/10',
    icon: 'bg-blue-500/10 text-blue-300',
  },
  amber: {
    border: 'border-amber-500/30 shadow-amber-900/30',
    glow: 'from-amber-500/10',
    icon: 'bg-amber-500/10 text-amber-300',
  },
};

const ConfirmDialog = ({
  open,
  title,
  description,
  cancelLabel = 'Keep editing',
  confirmLabel = 'Discard & exit',
  onCancel,
  onConfirm,
  accent = 'blue',
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const previousFocus = useRef(null);
  const restoreFocus = useRef(true);
  const theme = ACCENTS[accent] || ACCENTS.blue;

  useEffect(() => {
    if (!open) return;
    restoreFocus.current = true;
    previousFocus.current = document.activeElement;
    cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) return;
    if (restoreFocus.current && previousFocus.current?.focus) previousFocus.current.focus();
    previousFocus.current = null;
  }, [open]);

  if (!open) return null;

  const handleCancel = () => {
    restoreFocus.current = true;
    onCancel();
  };

  const handleConfirm = () => {
    restoreFocus.current = false;
    onConfirm();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
      return;
    }
    if (e.key !== 'Tab') return;
    const first = cancelRef.current;
    const last = confirmRef.current;
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={handleCancel} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl border bg-slate-900/95 p-6 shadow-2xl ${theme.border}`}
      >
        <div className={`absolute inset-x-0 top-0 h-24 bg-linear-to-b to-transparent pointer-events-none ${theme.glow}`} />
        <div className="relative">
          <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full ${theme.icon}`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.1 14A1.5 1.5 0 003.5 20h17a1.5 1.5 0 001.31-2.14l-8.1-14a1.5 1.5 0 00-2.62 0z" />
            </svg>
          </div>
          <h2 id={titleId} className="mb-2 text-2xl font-serif tracking-wide text-white">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm leading-relaxed text-slate-300">
            {description}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-white/15 active:scale-[0.98]"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={handleConfirm}
              className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 transition-all duration-200 hover:bg-red-500/25 active:scale-[0.98]"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
