import { useEffect, useState, useRef, useCallback } from 'react';
import { renderDiagram } from '@/lib/mermaid-config';
import { ZoomIn, ZoomOut, Maximize2, Hand, RotateCcw } from 'lucide-react';

interface DiagramPreviewProps {
  code: string;
  isDark: boolean;
  onSvgGenerated?: (svg: string) => void;
}

export function DiagramPreview({ code, isDark, onSvgGenerated }: DiagramPreviewProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [positionStart, setPositionStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const renderIdRef = useRef(0);

  // Handle mouse wheel zoom with non-passive listener to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Only zoom if Ctrl/Cmd is pressed, otherwise allow normal scroll
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom((prev) => Math.min(Math.max(prev + delta, 25), 300));
      }
    };

    // Attach with passive: false to allow preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Handle pan/drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent text selection during drag
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setPositionStart({ x: position.x, y: position.y });
  }, [position]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      
      setPosition({
        x: positionStart.x + dx,
        y: positionStart.y + dy,
      });
    },
    [isPanning, panStart, positionStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Render diagram when code changes
  useEffect(() => {
    if (!code.trim()) {
      setSvg('');
      setError(null);
      return;
    }

    const currentRenderId = ++renderIdRef.current;
    setIsRendering(true);
    setError(null);

    // Small delay to debounce rapid typing
    const timeoutId = setTimeout(async () => {
      try {
        const renderedSvg = await renderDiagram(
          code,
          `mermaid-diagram-${currentRenderId}`,
          isDark
        );
        
        // Only update if this is still the latest render request
        if (currentRenderId === renderIdRef.current) {
          setSvg(renderedSvg);
          setError(null);
          onSvgGenerated?.(renderedSvg);
        }
      } catch (err) {
        if (currentRenderId === renderIdRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to render diagram';
          setError(errorMessage);
          setSvg('');
        }
      } finally {
        if (currentRenderId === renderIdRef.current) {
          setIsRendering(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [code, isDark, onSvgGenerated]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 25, 25));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleFitToView = useCallback(() => {
    // Reset zoom and position
    setZoom(100);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Reset position when diagram changes
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [svg]);

  return (
    <div className="h-full flex flex-col bg-background-secondary">
      {/* Preview toolbar */}
      <div className="h-10 border-b border-border bg-background flex items-center px-3 gap-2 shrink-0">
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
          Preview
        </span>
        
        <div className="flex-1" />
        
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="btn btn-ghost btn-icon h-7 w-7"
            title="Zoom out"
            disabled={zoom <= 25}
          >
            <ZoomOut size={14} />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="btn btn-ghost h-7 px-2 text-xs font-mono min-w-[3.5rem]"
            title="Reset zoom"
          >
            {zoom}%
          </button>
          
          <button
            onClick={handleZoomIn}
            className="btn btn-ghost btn-icon h-7 w-7"
            title="Zoom in"
            disabled={zoom >= 300}
          >
            <ZoomIn size={14} />
          </button>
          
          <div className="w-px h-4 bg-border mx-1" />
          
          <button
            onClick={handleFitToView}
            className="btn btn-ghost btn-icon h-7 w-7"
            title="Fit to view"
          >
            <Maximize2 size={14} />
          </button>
          
          <button
            onClick={handleResetZoom}
            className="btn btn-ghost btn-icon h-7 w-7"
            title="Reset view"
          >
            <RotateCcw size={14} />
          </button>
          
          <div className="w-px h-4 bg-border mx-1" />
          
          <div className="hidden sm:flex items-center gap-1 text-xs text-foreground-muted">
            <Hand size={14} />
            <span>Drag to pan • Ctrl+Scroll to zoom</span>
          </div>
        </div>
        
        {/* Rendering indicator */}
        {isRendering && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Diagram viewport */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden diagram-viewport ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {error ? (
          <div className="p-4">
            <div className="error-message">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-500 font-semibold">Syntax Error</span>
              </div>
              <pre className="text-sm">{error}</pre>
            </div>
          </div>
        ) : svg ? (
          <div
            ref={contentRef}
            className="mermaid-container animate-fade-in"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
              transformOrigin: 'center center',
              width: '100%',
              height: '100%',
            }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-foreground-muted">
            <div className="text-center">
              <FileIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Start typing to see your diagram</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple file icon component
function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
