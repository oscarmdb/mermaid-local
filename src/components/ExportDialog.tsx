import React, { useState, useCallback } from 'react';
import { X, Download, FileImage, FileCode, File } from 'lucide-react';
import { downloadFile, elementToPng, sanitizeSvgForExport } from '@/lib/utils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  svg: string;
  code: string;
}

type ExportFormat = 'svg' | 'png' | 'png2x' | 'mmd';

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const exportOptions: ExportOption[] = [
  {
    format: 'svg',
    label: 'SVG',
    description: 'Scalable vector graphics, best for web',
    icon: <FileCode size={20} />,
  },
  {
    format: 'png',
    label: 'PNG (1x)',
    description: 'Standard resolution image',
    icon: <FileImage size={20} />,
  },
  {
    format: 'png2x',
    label: 'PNG (2x)',
    description: 'High resolution for retina displays',
    icon: <FileImage size={20} />,
  },
  {
    format: 'mmd',
    label: 'Mermaid (.mmd)',
    description: 'Source code file',
    icon: <File size={20} />,
  },
];

export function ExportDialog({ isOpen, onClose, svg, code }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('svg');

  const handleExport = useCallback(async () => {
    if (!svg && selectedFormat !== 'mmd') {
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const baseFilename = `mermaid-diagram-${timestamp}`;

      switch (selectedFormat) {
        case 'svg': {
          // Sanitize SVG to fix invalid HTML inside foreignObject elements
          const sanitizedSvg = sanitizeSvgForExport(svg);
          const blob = new Blob([sanitizedSvg], { type: 'image/svg+xml' });
          downloadFile(blob, `${baseFilename}.svg`);
          break;
        }
        case 'png': {
          const pngBlob = await elementToPng(svg, 1);
          downloadFile(pngBlob, `${baseFilename}.png`);
          break;
        }
        case 'png2x': {
          const png2xBlob = await elementToPng(svg, 2);
          downloadFile(png2xBlob, `${baseFilename}@2x.png`);
          break;
        }
        case 'mmd': {
          const blob = new Blob([code], { type: 'text/plain' });
          downloadFile(blob, `${baseFilename}.mmd`);
          break;
        }
      }

      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [svg, code, selectedFormat, onClose]);

  if (!isOpen) return null;

  const canExport = selectedFormat === 'mmd' || !!svg;

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
        className="dialog-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 id="export-title" className="text-xl font-semibold">
            Export Diagram
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Format options */}
        <div className="space-y-2 mb-6">
          {exportOptions.map((option) => (
            <button
              key={option.format}
              onClick={() => setSelectedFormat(option.format)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                selectedFormat === option.format
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  selectedFormat === option.format
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-foreground-muted'
                }`}
              >
                {option.icon}
              </div>
              <div className="text-left">
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-foreground-muted">
                  {option.description}
                </div>
              </div>
              {selectedFormat === option.format && (
                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Warning if no SVG */}
        {!svg && selectedFormat !== 'mmd' && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400">
            No diagram to export. Please create a valid diagram first.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!canExport || isExporting}
            className="btn btn-primary"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
