/**
 * Presenter Mode Component
 * 
 * Fullscreen view of the diagram with title and description.
 */

import { useEffect, useCallback, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface PresenterModeProps {
  isOpen: boolean;
  onClose: () => void;
  svg: string;
  title?: string;
  description?: string;
  isDark: boolean;
}

export function PresenterMode({ 
  isOpen, 
  onClose, 
  svg, 
  title, 
  description,
  isDark 
}: PresenterModeProps) {
  const [zoom, setZoom] = useState(150); // Start at 150% for better visibility

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === '+' || e.key === '=') {
        setZoom(prev => Math.min(prev + 25, 500));
      }
      if (e.key === '-') {
        setZoom(prev => Math.max(prev - 25, 25));
      }
      if (e.key === '0') {
        setZoom(150);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 25, 500));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 25, 25));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(150);
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] ${isDark ? 'dark' : ''}`}
      style={{ backgroundColor: isDark ? '#1a1a2e' : '#f8fafc' }}
    >
      {/* Header with title */}
      {(title || description) && (
        <div className="absolute top-0 left-0 right-0 p-6 z-10">
          <div className="max-w-4xl mx-auto text-center">
            {title && (
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
              >
                {title}
              </h1>
            )}
            {description && (
              <p 
                className="text-lg opacity-70"
                style={{ color: isDark ? '#94a3b8' : '#64748b' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
        style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
        title="Close (Esc)"
      >
        <X size={24} />
      </button>

      {/* Zoom controls */}
      <div 
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-full"
        style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)' }}
      >
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          title="Zoom out (-)"
          disabled={zoom <= 25}
        >
          <ZoomOut size={20} />
        </button>
        
        <button
          onClick={handleResetZoom}
          className="px-3 py-1 rounded-full hover:bg-white/10 transition-colors font-mono text-sm min-w-[4rem]"
          style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          title="Reset zoom (0)"
        >
          {zoom}%
        </button>
        
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          title="Zoom in (+)"
          disabled={zoom >= 500}
        >
          <ZoomIn size={20} />
        </button>

        <div 
          className="w-px h-6 mx-1"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
        />

        <button
          onClick={handleResetZoom}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}
          title="Reset view"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Diagram container */}
      <div 
        className="absolute inset-0 flex items-center justify-center overflow-auto"
        style={{ paddingTop: title || description ? '140px' : '60px', paddingBottom: '80px' }}
      >
        <div
          className="mermaid-container"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Keyboard hints */}
      <div 
        className="absolute bottom-6 right-6 text-xs opacity-50"
        style={{ color: isDark ? '#94a3b8' : '#64748b' }}
      >
        <span>Esc to close • +/- to zoom • 0 to reset</span>
      </div>
    </div>
  );
}
