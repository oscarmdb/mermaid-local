import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  ViewportPortal,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Trash2,
  MousePointer2,
  Pen,
  Undo2,
  Eraser,
  Eye,
  EyeOff,
  FileCode2,
} from 'lucide-react';
import { Icon } from '@iconify/react';
import { nodeTypes } from './nodes';
import { BaseNodeData } from './nodes/BaseNode';
import { nodesToMermaid } from '@/lib/designer-sync';
import { nodeTemplates, cloudTemplates, mongodbTemplates, streamingTemplates } from './templates';

interface SketchDesignerProps {
  /** Called with generated Mermaid code when the user hits "Convert to Mermaid" */
  onConvert: (code: string) => void;
  isDark: boolean;
}

interface SketchPoint {
  x: number;
  y: number;
}

interface SketchStroke {
  id: string;
  color: string;
  size: number;
  points: SketchPoint[];
}

const PEN_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
const PEN_SIZES = [2, 4, 8];

function pointsToPath(points: SketchPoint[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y}` + rest.map((p) => ` L ${p.x} ${p.y}`).join('');
}

function SketchInner({ onConvert, isDark }: SketchDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition, getIntersectingNodes } = useReactFlow();
  const [diagramType, setDiagramType] = useState<'flowchart' | 'block' | 'architecture'>('architecture');
  const nodeIdCounter = useRef(1);

  // Pen / sketch state
  const [tool, setTool] = useState<'select' | 'pen'>('pen');
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penSize, setPenSize] = useState(PEN_SIZES[1]);
  const [strokes, setStrokes] = useState<SketchStroke[]>([]);
  const [inkVisible, setInkVisible] = useState(true);
  const [currentPoints, setCurrentPoints] = useState<SketchPoint[] | null>(null);
  const drawingPointerId = useRef<number | null>(null);

  // --- Pen drawing (strokes stored in flow coordinates so they pan/zoom with canvas) ---
  const handlePenDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drawingPointerId.current = e.pointerId;
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setCurrentPoints([p]);
    },
    [screenToFlowPosition]
  );

  const handlePenMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (drawingPointerId.current !== e.pointerId) return;
      const p = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setCurrentPoints((pts) => (pts ? [...pts, p] : pts));
    },
    [screenToFlowPosition]
  );

  const handlePenUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (drawingPointerId.current !== e.pointerId) return;
      drawingPointerId.current = null;
      setCurrentPoints((pts) => {
        if (pts && pts.length > 0) {
          // Single click = draw a dot (avoid degenerate single-point path)
          const points = pts.length === 1 ? [pts[0], { x: pts[0].x + 0.01, y: pts[0].y }] : pts;
          setStrokes((s) => [
            ...s,
            { id: `stroke_${Date.now()}`, color: penColor, size: penSize, points },
          ]);
        }
        return null;
      });
    },
    [penColor, penSize]
  );

  const undoStroke = useCallback(() => setStrokes((s) => s.slice(0, -1)), []);
  const clearInk = useCallback(() => setStrokes([]), []);

  // --- Node handling (mirrors ArchitectureDesigner) ---
  const handleLabelChange = useCallback(
    (nodeId: string, newLabel: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, label: newLabel } } : node
        )
      );
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}-${Date.now()}`,
        data: {
          sourceSide: connection.sourceHandle,
          targetSide: connection.targetHandle,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataStr = event.dataTransfer.getData('application/reactflow');
      if (!dataStr) return;

      const { type, icon } = JSON.parse(dataStr);

      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const intersections = getIntersectingNodes({
        x: position.x,
        y: position.y,
        width: 1,
        height: 1,
      });
      const parentGroup = intersections.find((n) => n.type === 'group');

      const newNode: Node = {
        id: `node_${nodeIdCounter.current++}`,
        type,
        position: parentGroup
          ? { x: position.x - parentGroup.position.x, y: position.y - parentGroup.position.y }
          : position,
        parentId: parentGroup?.id,
        extent: parentGroup ? 'parent' : undefined,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeIdCounter.current - 1}`,
          nodeType: type as BaseNodeData['nodeType'],
          icon: icon,
          onLabelChange: handleLabelChange,
        } as BaseNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
      // Dropping a component implies the user wants to interact with it
      setTool('select');
    },
    [setNodes, handleLabelChange, screenToFlowPosition, getIntersectingNodes]
  );

  const onNodeDragStop = useCallback(
    (_event: MouseEvent | TouchEvent, node: Node) => {
      if (node.type === 'group') return;

      const intersections = getIntersectingNodes(node);
      const parentGroup = intersections.find((n) => n.type === 'group' && n.id !== node.id);

      if (parentGroup && node.parentId !== parentGroup.id) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  parentId: parentGroup.id,
                  extent: 'parent' as const,
                  position: { x: 50, y: 50 },
                }
              : n
          )
        );
      } else if (!parentGroup && node.parentId) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === node.id
              ? {
                  ...n,
                  parentId: undefined,
                  extent: undefined,
                  position: { x: node.position.x + 100, y: node.position.y + 100 },
                }
              : n
          )
        );
      }
    },
    [getIntersectingNodes, setNodes]
  );

  const onDelete = useCallback(() => {
    const selectedIds = nodes.filter((n) => n.selected).map((n) => n.id);
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) =>
      eds.filter((edge) => !selectedIds.includes(edge.source) && !selectedIds.includes(edge.target))
    );
  }, [nodes, setNodes, setEdges]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onDelete();
      } else if (e.key === 'p') {
        setTool('pen');
      } else if (e.key === 'v') {
        setTool('select');
      } else if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        undoStroke();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDelete, undoStroke]);

  const onClearAll = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setStrokes([]);
    nodeIdCounter.current = 1;
  }, [setNodes, setEdges]);

  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, icon?: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, icon }));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // --- Convert dropped components to Mermaid (sketch ink stays visual-only) ---
  const handleConvert = useCallback(() => {
    const code = nodesToMermaid(nodes, edges, diagramType);
    onConvert(code);
  }, [nodes, edges, diagramType, onConvert]);

  const toolButtonClass = (active: boolean) =>
    `p-2 rounded-lg transition-colors ${
      active
        ? 'bg-primary text-white'
        : 'text-foreground-muted hover:text-foreground hover:bg-accent'
    }`;

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      <div className="w-48 border-r border-border bg-background p-4 flex flex-col gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground-muted">Diagram Type</div>
          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as 'flowchart' | 'block' | 'architecture')}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-accent transition-colors"
          >
            <option value="flowchart">Flowchart</option>
            <option value="block">Block Diagram</option>
            <option value="architecture">Architecture</option>
          </select>
        </div>

        <div className="h-full overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Standard</div>
              <div className="flex flex-col gap-2">
                {nodeTemplates.map(({ type, label, icon: TemplateIcon, color }) => (
                  <div
                    key={`${type}-${label}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, type)}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg border-2 cursor-grab active:cursor-grabbing
                      transition-all hover:shadow-md
                      ${color === 'primary' ? 'bg-primary/10 border-primary/30 text-primary' :
                        `bg-${color}-50 dark:bg-${color}-950 border-${color}-300 dark:border-${color}-700 text-${color}-800 dark:text-${color}-200`}
                    `}
                  >
                    <TemplateIcon size={16} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Cloud Provider</div>
              <div className="flex flex-col gap-2">
                {cloudTemplates.map(({ type, label, iconStr }) => (
                  <div
                    key={`${type}-${label}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, type, iconStr)}
                    className="flex items-center gap-3 p-2 rounded-lg border-2 border-border bg-card/50 cursor-grab active:cursor-grabbing transition-all hover:shadow-md text-foreground"
                  >
                    <Icon icon={iconStr} width={16} height={16} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">MongoDB</div>
              <div className="flex flex-col gap-2">
                {mongodbTemplates.map(({ type, label, iconStr }) => (
                  <div
                    key={`${type}-${label}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, type, iconStr)}
                    className="flex items-center gap-3 p-2 rounded-lg border-2 border-border bg-card/50 cursor-grab active:cursor-grabbing transition-all hover:shadow-md text-foreground"
                  >
                    <Icon icon={iconStr} width={16} height={16} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-foreground-muted uppercase tracking-wider mb-2">Streaming &amp; Cache</div>
              <div className="flex flex-col gap-2">
                {streamingTemplates.map(({ type, label, iconStr }) => (
                  <div
                    key={`${type}-${label}`}
                    draggable
                    onDragStart={(e) => onDragStart(e, type, iconStr)}
                    className="flex items-center gap-3 p-2 rounded-lg border-2 border-border bg-card/50 cursor-grab active:cursor-grabbing transition-all hover:shadow-md text-foreground"
                  >
                    <Icon icon={iconStr} width={16} height={16} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="space-y-2 pb-4">
            <button
              onClick={handleConvert}
              disabled={nodes.length === 0}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileCode2 size={16} />
              Convert to Mermaid
            </button>
            <button
              onClick={onDelete}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
            <button
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            animated: false,
            style: { strokeWidth: 2 },
          }}
          className={isDark ? 'dark' : ''}
        >
          <Controls className="!bg-background !border-border !shadow-lg" />
          <MiniMap className="!bg-background !border-border" />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={isDark ? '#374151' : '#d1d5db'}
          />

          {/* Sketch ink layer — rendered in flow coordinates so it pans/zooms with the canvas */}
          {inkVisible && (
            <ViewportPortal>
              <svg
                style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
                width={1}
                height={1}
              >
                {strokes.map((stroke) => (
                  <path
                    key={stroke.id}
                    d={pointsToPath(stroke.points)}
                    stroke={stroke.color}
                    strokeWidth={stroke.size}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9}
                  />
                ))}
                {currentPoints && (
                  <path
                    d={pointsToPath(currentPoints)}
                    stroke={penColor}
                    strokeWidth={penSize}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.9}
                  />
                )}
              </svg>
            </ViewportPortal>
          )}

          {/* Toolbar rendered outside ReactFlow (see below) so it stays clickable above the pen overlay */}

          <Panel position="bottom-center" className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border text-foreground-muted">
            <span className="text-xs">
              {tool === 'pen'
                ? 'Sketch freely with the pen • Drop components from the palette when ready • Ink stays as a sketch layer'
                : 'Drag components from the palette • Connect handles to link • Convert to Mermaid when done'}
            </span>
          </Panel>
        </ReactFlow>

        {/* Pen capture overlay (sits above React Flow while pen is active) */}
        {tool === 'pen' && (
          <div
            className="absolute inset-0 z-10 cursor-crosshair"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePenDown}
            onPointerMove={handlePenMove}
            onPointerUp={handlePenUp}
            onPointerCancel={handlePenUp}
          />
        )}

        {/* Toolbar (above the pen overlay so it stays clickable) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border text-foreground shadow-lg">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTool('select')}
              className={toolButtonClass(tool === 'select')}
              title="Select / move (v)"
            >
              <MousePointer2 size={16} />
            </button>
            <button
              onClick={() => setTool('pen')}
              className={toolButtonClass(tool === 'pen')}
              title="Pen (p)"
            >
              <Pen size={16} />
            </button>

            <div className="w-px h-5 bg-border mx-1" />

            {PEN_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setPenColor(color);
                  setTool('pen');
                }}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${
                  penColor === color && tool === 'pen'
                    ? 'border-foreground scale-110'
                    : 'border-transparent hover:scale-110'
                }`}
                style={{ backgroundColor: color }}
                title={`Pen color ${color}`}
              />
            ))}

            <div className="w-px h-5 bg-border mx-1" />

            {PEN_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPenSize(size);
                  setTool('pen');
                }}
                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${
                  penSize === size ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
                title={`Pen size ${size}px`}
              >
                <span
                  className="rounded-full bg-foreground"
                  style={{ width: Math.min(size + 2, 12), height: Math.min(size + 2, 12) }}
                />
              </button>
            ))}

            <div className="w-px h-5 bg-border mx-1" />

            <button
              onClick={undoStroke}
              disabled={strokes.length === 0}
              className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              title="Undo last stroke (Cmd/Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={clearInk}
              disabled={strokes.length === 0}
              className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
              title="Clear all ink"
            >
              <Eraser size={16} />
            </button>
            <button
              onClick={() => setInkVisible((v) => !v)}
              className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-accent transition-colors"
              title={inkVisible ? 'Hide ink' : 'Show ink'}
            >
              {inkVisible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SketchDesigner(props: SketchDesignerProps) {
  return (
    <ReactFlowProvider>
      <SketchInner {...props} />
    </ReactFlowProvider>
  );
}
