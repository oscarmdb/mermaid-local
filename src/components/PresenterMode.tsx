/**
 * Presenter Mode Component
 *
 * Fullscreen view of the diagram with title and description. Automatically
 * fits the diagram to the window size, and provides annotation tools
 * (freehand pen, comment pins) for live architecture review sessions.
 */

import { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand,
  Pen,
  MessageSquarePlus,
  Eye,
  EyeOff,
  Undo2,
  Trash2,
} from 'lucide-react';
import type { AnnotationComment } from '@/lib/db';
import {
  createAnnotationComment,
  updateAnnotationComment,
  deleteAnnotationComment,
  deleteLastAnnotationStroke,
  clearAnnotations,
} from '@/hooks/useDatabase';
import { AnnotationLayer, type AnnotationTool } from './AnnotationLayer';

const PEN_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
const MIN_ZOOM = 10;
const MAX_ZOOM = 800;

interface PresenterModeProps {
  isOpen: boolean;
  onClose: () => void;
  svg: string;
  diagramId: string | null;
  title?: string;
  description?: string;
  isDark: boolean;
}

interface CommentDraft {
  id?: string;
  x: number;
  y: number;
  text: string;
}

/** Extract the diagram's natural size from the SVG viewBox */
function parseNaturalSize(svg: string): { width: number; height: number } | null {
  if (!svg) return null;
  // Use lenient HTML parsing - mermaid SVGs (foreignObject labels, icon
  // markup) are often not valid XML and would fail DOMParser in XML mode.
  const holder = document.createElement('div');
  holder.innerHTML = svg;
  const el = holder.querySelector('svg');
  if (!el) return null;

  const viewBox = el.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  const width = parseFloat(el.getAttribute('width') ?? '');
  const height = parseFloat(el.getAttribute('height') ?? '');
  if (width > 0 && height > 0) return { width, height };
  return null;
}

export function PresenterMode({
  isOpen,
  onClose,
  svg,
  diagramId,
  title,
  description,
  isDark,
}: PresenterModeProps) {
  const [zoom, setZoom] = useState(100);
  const [tool, setTool] = useState<AnnotationTool>('pan');
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [commentDraft, setCommentDraft] = useState<CommentDraft | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const panStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const naturalSize = useMemo(() => parseNaturalSize(svg), [svg]);
  const canAnnotate = !!diagramId && !!naturalSize;

  // Fit the diagram to the available window size
  const fitToWindow = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    const viewport = viewportRef.current;
    if (!viewport || !naturalSize) {
      setZoom(100);
      return;
    }
    const availWidth = viewport.clientWidth - 64;
    const availHeight = viewport.clientHeight - 48;
    const scale = Math.min(availWidth / naturalSize.width, availHeight / naturalSize.height);
    setZoom(Math.min(Math.max(Math.round(scale * 100), MIN_ZOOM), MAX_ZOOM));
  }, [naturalSize]);

  // Fit on open and whenever the diagram changes
  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(fitToWindow);
    return () => cancelAnimationFrame(raf);
  }, [isOpen, fitToWindow]);

  // Reset transient state when closing
  useEffect(() => {
    if (!isOpen) {
      setTool('pan');
      setCommentDraft(null);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (commentDraft) {
          setCommentDraft(null);
        } else {
          onClose();
        }
        return;
      }

      // Don't hijack keys while typing a comment
      const target = e.target as HTMLElement;
      if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return;

      if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 25, MAX_ZOOM));
      } else if (e.key === '-') {
        setZoom((prev) => Math.max(prev - 25, MIN_ZOOM));
      } else if (e.key === '0' || e.key === 'f') {
        fitToWindow();
      } else if (e.key === 'h') {
        setTool('pan');
      } else if (e.key === 'p' && canAnnotate) {
        setTool('pen');
      } else if (e.key === 'c' && canAnnotate) {
        setTool('comment');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, fitToWindow, commentDraft, canAnnotate]);

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

  // Ctrl/Cmd + wheel zooms, plain wheel/trackpad pans
  useEffect(() => {
    if (!isOpen) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? -10 : 10;
        setZoom((prev) => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM));
      } else {
        setPosition((prev) => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
      }
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [isOpen]);

  // Pan by dragging (moves the diagram)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool !== 'pan' || e.button !== 0) return;
    e.preventDefault();
    panStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    setIsPanning(true);
  }, [tool, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const panState = panStateRef.current;
    if (!panState) return;
    setPosition({
      x: panState.originX + (e.clientX - panState.startX),
      y: panState.originY + (e.clientY - panState.startY),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    panStateRef.current = null;
    setIsPanning(false);
  }, []);

  // Comment handlers
  const handleAddCommentAt = useCallback((x: number, y: number) => {
    setCommentDraft({ x, y, text: '' });
  }, []);

  const handleSelectComment = useCallback((comment: AnnotationComment) => {
    setCommentDraft({ id: comment.id, x: comment.x, y: comment.y, text: comment.text });
  }, []);

  const handleSaveComment = useCallback(async () => {
    if (!commentDraft || !diagramId || !commentDraft.text.trim()) return;
    if (commentDraft.id) {
      await updateAnnotationComment(commentDraft.id, { text: commentDraft.text.trim() });
    } else {
      await createAnnotationComment(diagramId, {
        x: commentDraft.x,
        y: commentDraft.y,
        text: commentDraft.text.trim(),
      });
    }
    setCommentDraft(null);
  }, [commentDraft, diagramId]);

  const handleDeleteComment = useCallback(async () => {
    if (!commentDraft?.id) return;
    await deleteAnnotationComment(commentDraft.id);
    setCommentDraft(null);
  }, [commentDraft]);

  const handleUndoStroke = useCallback(() => {
    if (diagramId) void deleteLastAnnotationStroke(diagramId);
  }, [diagramId]);

  const handleClearAnnotations = useCallback(() => {
    if (!diagramId) return;
    if (window.confirm('Remove all pen strokes and comments for this diagram?')) {
      void clearAnnotations(diagramId);
    }
  }, [diagramId]);

  if (!isOpen) return null;

  const scale = zoom / 100;
  const fgColor = isDark ? '#f1f5f9' : '#1e293b';
  const toolButtonStyle = (active: boolean): React.CSSProperties => ({
    color: fgColor,
    backgroundColor: active ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)') : 'transparent',
  });

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col ${isDark ? 'dark' : ''}`}
      style={{ backgroundColor: isDark ? '#1a1a2e' : '#f8fafc' }}
    >
      {/* Header with title */}
      {(title || description) && (
        <div className="shrink-0 px-6 pt-5 pb-2 z-10">
          <div className="max-w-4xl mx-auto text-center">
            {title && (
              <h1 className="text-3xl font-bold mb-1" style={{ color: fgColor }}>
                {title}
              </h1>
            )}
            {description && (
              <p className="text-lg opacity-70" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
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
        style={{ color: fgColor }}
        title="Close (Esc)"
      >
        <X size={24} />
      </button>

      {/* Diagram viewport */}
      <div
        ref={viewportRef}
        className="flex-1 overflow-hidden flex items-center justify-center min-h-0"
        style={{
          cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : undefined,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div style={{ transform: `translate(${position.x}px, ${position.y}px)`, flexShrink: 0 }}>
          {naturalSize ? (
            <div style={{ width: naturalSize.width * scale, height: naturalSize.height * scale }}>
              <div
                className="mermaid-container presenter-svg"
                style={{
                  width: naturalSize.width,
                  height: naturalSize.height,
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                  position: 'relative',
                }}
              >
                <div style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: svg }} />
                {canAnnotate && diagramId && (
                  <AnnotationLayer
                    diagramId={diagramId}
                    width={naturalSize.width}
                    height={naturalSize.height}
                    tool={tool}
                    penColor={penColor}
                    penSize={3}
                    visible={showAnnotations}
                    draftPin={commentDraft && !commentDraft.id ? commentDraft : null}
                    onAddComment={handleAddCommentAt}
                    onSelectComment={handleSelectComment}
                  />
                )}
              </div>
            </div>
          ) : (
            <div
              className="mermaid-container"
              style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-3 py-2 rounded-full"
        style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)' }}
      >
        {/* Tools */}
        <button
          onClick={() => setTool('pan')}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          style={toolButtonStyle(tool === 'pan')}
          title="Pan (h)"
        >
          <Hand size={20} />
        </button>
        <button
          onClick={() => setTool('pen')}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          style={toolButtonStyle(tool === 'pen')}
          title={canAnnotate ? 'Pen - draw on the diagram (p)' : 'Save the diagram to a project to annotate'}
          disabled={!canAnnotate}
        >
          <Pen size={20} />
        </button>
        <button
          onClick={() => setTool('comment')}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          style={toolButtonStyle(tool === 'comment')}
          title={canAnnotate ? 'Comment - click the diagram to pin a note (c)' : 'Save the diagram to a project to annotate'}
          disabled={!canAnnotate}
        >
          <MessageSquarePlus size={20} />
        </button>

        {/* Pen colors */}
        {tool === 'pen' && (
          <div className="flex items-center gap-1.5 px-1.5">
            {PEN_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setPenColor(color)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  outline: penColor === color ? `2px solid ${fgColor}` : 'none',
                  outlineOffset: '2px',
                }}
                title={`Pen color ${color}`}
              />
            ))}
          </div>
        )}

        {canAnnotate && (
          <>
            <button
              onClick={handleUndoStroke}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: fgColor }}
              title="Undo last pen stroke"
            >
              <Undo2 size={20} />
            </button>
            <button
              onClick={() => setShowAnnotations((v) => !v)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: fgColor }}
              title={showAnnotations ? 'Hide annotations' : 'Show annotations'}
            >
              {showAnnotations ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
            <button
              onClick={handleClearAnnotations}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              style={{ color: fgColor }}
              title="Clear all annotations"
            >
              <Trash2 size={20} />
            </button>
          </>
        )}

        <div
          className="w-px h-6 mx-1"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
        />

        {/* Zoom controls */}
        <button
          onClick={() => setZoom((prev) => Math.max(prev - 25, MIN_ZOOM))}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          style={{ color: fgColor }}
          title="Zoom out (-)"
          disabled={zoom <= MIN_ZOOM}
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={fitToWindow}
          className="px-3 py-1 rounded-full hover:bg-white/10 transition-colors font-mono text-sm min-w-[4rem]"
          style={{ color: fgColor }}
          title="Fit to window (f)"
        >
          {zoom}%
        </button>
        <button
          onClick={() => setZoom((prev) => Math.min(prev + 25, MAX_ZOOM))}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-30"
          style={{ color: fgColor }}
          title="Zoom in (+)"
          disabled={zoom >= MAX_ZOOM}
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={fitToWindow}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          style={{ color: fgColor }}
          title="Fit to window (f)"
        >
          <Maximize size={20} />
        </button>
      </div>

      {/* Comment editor */}
      {commentDraft && (
        <div
          className="absolute bottom-24 right-6 z-30 w-80 rounded-xl border shadow-xl p-3 space-y-2"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            borderColor: isDark ? '#334155' : '#e2e8f0',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: fgColor }}>
              {commentDraft.id ? 'Edit Comment' : 'New Comment'}
            </span>
            <button
              onClick={() => setCommentDraft(null)}
              className="p-1 rounded hover:bg-black/10"
              style={{ color: fgColor }}
              title="Cancel (Esc)"
            >
              <X size={16} />
            </button>
          </div>
          <textarea
            autoFocus
            rows={3}
            value={commentDraft.text}
            onChange={(e) => setCommentDraft((prev) => (prev ? { ...prev, text: e.target.value } : prev))}
            placeholder="e.g. Consider Atlas Search here instead of a separate cluster"
            className="w-full text-sm rounded-lg border px-3 py-2 resize-none focus:outline-none"
            style={{
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              borderColor: isDark ? '#334155' : '#e2e8f0',
              color: fgColor,
            }}
          />
          <div className="flex items-center justify-between">
            {commentDraft.id ? (
              <button
                onClick={handleDeleteComment}
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={handleSaveComment}
              disabled={!commentDraft.text.trim()}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div
        className="absolute bottom-6 left-6 text-xs opacity-50 z-10"
        style={{ color: isDark ? '#94a3b8' : '#64748b' }}
      >
        <span>Esc close • +/- zoom • f fit • h pan • p pen • c comment</span>
      </div>
    </div>
  );
}
