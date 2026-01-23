import { useCallback, useEffect, useState, useRef } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Server, Database, Cloud, User, Cog, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import { nodeTypes } from './nodes';
import { BaseNodeData } from './nodes/BaseNode';
import { nodesToMermaid, mermaidToNodes, isFlowchart } from '@/lib/designer-sync';

interface ArchitectureDesignerProps {
  code: string;
  onCodeChange: (code: string) => void;
  isDark: boolean;
}

const nodeTemplates = [
  { type: 'service', label: 'Service', icon: Server, color: 'blue' },
  { type: 'database', label: 'Database', icon: Database, color: 'green' },
  { type: 'cloud', label: 'Cloud', icon: Cloud, color: 'purple' },
  { type: 'user', label: 'User', icon: User, color: 'orange' },
  { type: 'process', label: 'Process', icon: Cog, color: 'yellow' },
] as const;

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export function ArchitectureDesigner({ code, onCodeChange, isDark }: ArchitectureDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isCompatible, setIsCompatible] = useState(true);
  const nodeIdCounter = useRef(1);
  const isUpdatingFromCode = useRef(false);
  const lastGeneratedCode = useRef('');

  // Sync from code to nodes (when code changes externally)
  useEffect(() => {
    if (!code) {
      setNodes([]);
      setEdges([]);
      setIsCompatible(true);
      return;
    }

    // Check if it's a flowchart
    const compatible = isFlowchart(code);
    setIsCompatible(compatible);

    if (!compatible) {
      return;
    }

    // Don't re-parse if we just generated this code
    if (code === lastGeneratedCode.current) {
      return;
    }

    isUpdatingFromCode.current = true;
    const { nodes: parsedNodes, edges: parsedEdges } = mermaidToNodes(code);
    
    // Update counter to avoid ID conflicts
    parsedNodes.forEach(n => {
      const numMatch = n.id.match(/\d+$/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        if (num >= nodeIdCounter.current) {
          nodeIdCounter.current = num + 1;
        }
      }
    });

    // Add onLabelChange callback to nodes
    const nodesWithCallbacks = parsedNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange: handleLabelChange,
      },
    }));

    setNodes(nodesWithCallbacks);
    setEdges(parsedEdges);
    
    setTimeout(() => {
      isUpdatingFromCode.current = false;
    }, 100);
  }, [code]);

  // Sync from nodes to code (when nodes/edges change)
  const syncToCode = useCallback(() => {
    if (isUpdatingFromCode.current || !isCompatible) return;
    
    const newCode = nodesToMermaid(nodes, edges);
    lastGeneratedCode.current = newCode;
    onCodeChange(newCode);
  }, [nodes, edges, isCompatible, onCodeChange]);

  // Debounced sync
  useEffect(() => {
    if (isUpdatingFromCode.current || !isCompatible) return;
    
    const timer = setTimeout(syncToCode, 300);
    return () => clearTimeout(timer);
  }, [nodes, edges, syncToCode, isCompatible]);

  // Handle label changes
  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, id: `e-${connection.source}-${connection.target}` }, eds));
    },
    [setEdges]
  );

  // Handle drag from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = {
        x: event.clientX - event.currentTarget.getBoundingClientRect().left - 60,
        y: event.clientY - event.currentTarget.getBoundingClientRect().top - 25,
      };

      const newNode: Node = {
        id: `node_${nodeIdCounter.current++}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeIdCounter.current - 1}`,
          nodeType: type as BaseNodeData['nodeType'],
          onLabelChange: handleLabelChange,
        } as BaseNodeData,
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, handleLabelChange]
  );

  // Delete selected nodes
  const onDelete = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => {
      const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
      return eds.filter(
        (edge) => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      );
    });
  }, [nodes, setNodes, setEdges]);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement?.tagName !== 'INPUT') {
        onDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDelete]);

  // Clear all
  const onClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    nodeIdCounter.current = 1;
  }, [setNodes, setEdges]);

  // Start drag from palette
  const onDragStart = useCallback((event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // If not a flowchart, show message
  if (!isCompatible) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Designer Not Available</h3>
        <p className="text-foreground-muted max-w-md">
          The visual designer only works with <strong>flowchart</strong> diagrams.
          Your current diagram type is not supported in the designer view.
        </p>
        <p className="text-sm text-foreground-muted mt-4">
          Supported diagram types: <code>flowchart TD</code>, <code>flowchart LR</code>, <code>graph TD</code>
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      <div className="w-48 border-r border-border bg-background p-4 flex flex-col gap-4">
        <div className="text-sm font-medium text-foreground-muted mb-2">Drag to add</div>
        
        {nodeTemplates.map(({ type, label, icon: Icon, color }) => (
          <div
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing
              transition-all hover:shadow-md
              bg-${color}-50 dark:bg-${color}-950 
              border-${color}-300 dark:border-${color}-700
              text-${color}-800 dark:text-${color}-200
              hover:border-${color}-400 dark:hover:border-${color}-600
            `}
            style={{
              backgroundColor: `var(--${color}-bg, ${color === 'blue' ? '#eff6ff' : color === 'green' ? '#f0fdf4' : color === 'purple' ? '#faf5ff' : color === 'orange' ? '#fff7ed' : '#fefce8'})`,
              borderColor: `var(--${color}-border)`,
            }}
          >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
          </div>
        ))}

        <div className="flex-1" />

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
          <button
            onClick={onClear}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
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
          <MiniMap
            nodeColor={(n) => {
              switch (n.type) {
                case 'database': return '#22c55e';
                case 'cloud': return '#a855f7';
                case 'user': return '#f97316';
                case 'process': return '#eab308';
                default: return '#3b82f6';
              }
            }}
            className="!bg-background !border-border"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={isDark ? '#374151' : '#d1d5db'}
          />
          
          <Panel position="top-center" className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border">
            <div className="flex items-center gap-2 text-sm text-foreground-muted">
              <ArrowRight size={14} />
              <span>Drag nodes from palette • Connect by dragging handles • Double-click to edit labels</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
