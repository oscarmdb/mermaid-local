import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';

interface SaveVersionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label?: string) => void | Promise<void>;
}

/**
 * Accessible replacement for window.prompt() when creating a manual,
 * labeled version. Focus-trapped, closes on Escape, submits on Enter.
 */
export function SaveVersionDialog({ isOpen, onClose, onSave }: SaveVersionDialogProps) {
  const [label, setLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setLabel('');
      setIsSaving(false);
      // Focus the input on open
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(label.trim() || undefined);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [label, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="dialog-content max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-version-title"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between mb-4">
            <h2 id="save-version-title" className="text-lg font-semibold">
              Save Version
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          <label htmlFor="version-label" className="block text-sm font-medium mb-1.5">
            Version label <span className="text-foreground-muted font-normal">(optional)</span>
          </label>
          <input
            ref={inputRef}
            id="version-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Reviewed with customer"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            maxLength={200}
          />

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Version'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
