/**
 * Generate Metadata Dialog
 * 
 * Uses LLM to generate title and description for a diagram
 */

import { useState, useCallback, useEffect } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLLMFeatures } from '@/hooks/useLLMFeatures';

interface GenerateMetadataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  currentTitle?: string;
  currentDescription?: string;
  onApply: (title: string, description: string) => void;
}

export function GenerateMetadataDialog({
  isOpen,
  onClose,
  code,
  currentTitle = '',
  currentDescription = '',
  onApply,
}: GenerateMetadataDialogProps) {
  const { isAvailable, generateMetadata, metadataStatus, metadataErrorMessage } = useLLMFeatures();
  
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setDescription(currentDescription);
      setHasGenerated(false);
    }
  }, [isOpen, currentTitle, currentDescription]);

  const handleGenerate = useCallback(async () => {
    const result = await generateMetadata(code);
    if (result) {
      setTitle(result.title);
      setDescription(result.description);
      setHasGenerated(true);
    }
  }, [code, generateMetadata]);

  const handleApply = useCallback(() => {
    onApply(title, description);
    onClose();
  }, [title, description, onApply, onClose]);

  if (!isOpen) return null;

  const isLoading = metadataStatus === 'loading';
  const hasError = metadataStatus === 'error';
  const canApply = title.trim().length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="dialog-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="dialog-content max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metadata-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-500" />
            <h2 id="metadata-title" className="text-lg font-semibold">Generate Metadata</h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {!isAvailable ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
            <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">LLM not configured</p>
                <p className="text-xs mt-1">Enable Ollama in Settings to use AI features.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Generate button */}
            <div className="mb-4">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !code.trim()}
                className="btn btn-secondary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : hasGenerated ? (
                  <>
                    <Sparkles size={16} />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Generate from Diagram
                  </>
                )}
              </button>
              
              {hasError && (
                <p className="text-xs text-red-500 mt-2">{metadataErrorMessage}</p>
              )}
              
              {hasGenerated && !hasError && (
                <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Generated successfully
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-foreground-muted">or edit manually</span>
              <div className="flex-1 border-t border-border" />
            </div>
          </>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter diagram title"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter diagram description"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-border">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="btn btn-primary"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
