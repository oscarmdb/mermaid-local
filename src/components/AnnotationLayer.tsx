/**
 * Annotation Layer
 *
 * SVG overlay rendered on top of a diagram at its natural size. Supports
 * freehand pen strokes and numbered comment pins. Coordinates are stored
 * in the diagram's natural coordinate space, so annotations stay anchored
 * to the architecture at any zoom level.
 */

import { useState, useCallback, useRef } from 'react';
import type { AnnotationComment } from '@/lib/db';
import {
  useAnnotationStrokes,
  useAnnotationComments,
  createAnnotationStroke,
} from '@/hooks/useDatabase';

export type AnnotationTool = 'pan' | 'pen' | 'comment';

interface Point {
  x: number;
  y: number;
}

interface AnnotationLayerProps {
  diagramId: string;
  /** Natural (unscaled) diagram width */
  width: number;
  /** Natural (unscaled) diagram height */
  height: number;
  tool: AnnotationTool;
  penColor: string;
  penSize: number;
  visible: boolean;
  /** Position of a comment being placed (not yet saved) */
  draftPin: Point | null;
  onAddComment: (x: number, y: number) => void;
  onSelectComment: (comment: AnnotationComment) => void;
}

function toPath(points: Point[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y}` + rest.map((p) => ` L ${p.x} ${p.y}`).join('');
}

export function AnnotationLayer({
  diagramId,
  width,
  height,
  tool,
  penColor,
  penSize,
  visible,
  draftPin,
  onAddComment,
  onSelectComment,
}: AnnotationLayerProps) {
  const strokes = useAnnotationStrokes(diagramId);
  const comments = useAnnotationComments(diagramId);

  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  const toNatural = useCallback(
    (e: React.PointerEvent): Point => {
      const rect = svgRef.current!.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * width,
        y: ((e.clientY - rect.top) / rect.height) * height,
      };
    },
    [width, height]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const point = toNatural(e);

      if (tool === 'pen') {
        e.preventDefault();
        svgRef.current?.setPointerCapture(e.pointerId);
        drawingRef.current = true;
        setCurrentPoints([point]);
      } else if (tool === 'comment') {
        onAddComment(point.x, point.y);
      }
    },
    [tool, toNatural, onAddComment]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawingRef.current) return;
      const point = toNatural(e);
      setCurrentPoints((prev) => [...prev, point]);
    },
    [toNatural]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      svgRef.current?.releasePointerCapture(e.pointerId);

      setCurrentPoints((points) => {
        if (points.length > 0) {
          // A click without movement becomes a dot
          const finalPoints =
            points.length === 1 ? [points[0], { x: points[0].x + 0.01, y: points[0].y }] : points;
          void createAnnotationStroke(diagramId, {
            color: penColor,
            size: penSize,
            points: finalPoints,
          });
        }
        return [];
      });
    },
    [diagramId, penColor, penSize]
  );

  if (!visible) return null;

  const interactive = tool === 'pen' || tool === 'comment';

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        pointerEvents: interactive ? 'auto' : 'none',
        cursor: tool === 'pen' ? 'crosshair' : tool === 'comment' ? 'copy' : 'default',
        touchAction: interactive ? 'none' : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Saved pen strokes */}
      {strokes.map((stroke) => (
        <path
          key={stroke.id}
          d={toPath(stroke.points)}
          stroke={stroke.color}
          strokeWidth={stroke.size}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.9}
        />
      ))}

      {/* Stroke currently being drawn */}
      {currentPoints.length > 0 && (
        <path
          d={toPath(currentPoints)}
          stroke={penColor}
          strokeWidth={penSize}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.9}
        />
      )}

      {/* Comment pins */}
      {comments.map((comment, index) => (
        <g
          key={comment.id}
          transform={`translate(${comment.x}, ${comment.y})`}
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onSelectComment(comment);
          }}
        >
          <circle r={11} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
            fill="#ffffff"
            style={{ userSelect: 'none' }}
          >
            {index + 1}
          </text>
        </g>
      ))}

      {/* Draft pin for a comment being placed */}
      {draftPin && (
        <g transform={`translate(${draftPin.x}, ${draftPin.y})`} style={{ pointerEvents: 'none' }}>
          <circle r={11} fill="#f59e0b" stroke="#ffffff" strokeWidth={2} strokeDasharray="3 2" opacity={0.8} />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fontWeight={700}
            fill="#ffffff"
          >
            {comments.length + 1}
          </text>
        </g>
      )}
    </svg>
  );
}
