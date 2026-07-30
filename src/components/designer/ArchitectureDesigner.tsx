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
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Server, Database, Cloud, User, HardDrive, Globe, Zap, Box, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { nodeTypes } from './nodes';
import { BaseNodeData } from './nodes/BaseNode';
import { nodesToMermaid, mermaidToNodes } from '@/lib/designer-sync';

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
  { type: 'server', label: 'Server', icon: Server, color: 'slate' },
  { type: 'disk', label: 'Storage', icon: HardDrive, color: 'indigo' },
  { type: 'internet', label: 'Internet', icon: Globe, color: 'cyan' },
  { type: 'junction', label: 'Junction', icon: Zap, color: 'primary' },
  { type: 'group', label: 'Group', icon: Box, color: 'gray' },
] as const;

const cloudTemplates = [
  { type: 'service', label: 'Lambda', iconStr: 'logos:aws-lambda' },
  { type: 'database', label: 'DynamoDB', iconStr: 'logos:aws-dynamodb' },
  { type: 'database', label: 'RDS/Aurora', iconStr: 'logos:aws-aurora' },
  { type: 'service', label: 'S3', iconStr: 'logos:aws-s3' },
  { type: 'server', label: 'EC2', iconStr: 'logos:aws-ec2' },
  { type: 'service', label: 'API Gateway', iconStr: 'logos:aws-api-gateway' },
  { type: 'service', label: 'CloudFront', iconStr: 'logos:aws-cloudfront' },
  { type: 'service', label: 'Route53', iconStr: 'logos:aws-route53' },
  { type: 'service', label: 'OpenSearch', iconStr: 'logos:aws-open-search' },
  { type: 'service', label: 'Kubernetes', iconStr: 'logos:kubernetes' },
  { type: 'service', label: 'Docker', iconStr: 'logos:docker-icon' },
  { type: 'cloud', label: 'GCP', iconStr: 'logos:google-cloud' },
  { type: 'cloud', label: 'Azure', iconStr: 'logos:microsoft-azure' },
] as const;

const mongodbTemplates = [
  { type: 'cloud', label: 'Atlas', iconStr: 'logos:mongodb-icon' },
  { type: 'group', label: 'Cluster', iconStr: 'logos:mongodb' },
  { type: 'database', label: 'Database', iconStr: 'logos:mongodb-icon' },
  { type: 'service', label: 'Compass', iconStr: 'logos:mongodb' },
] as const;

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function DesignerInner({ code, onCodeChange, isDark }: ArchitectureDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, getIntersectingNodes } = useReactFlow();
  const [isCompatible, setIsCompatible] = useState(true);
  const [diagramType, setDiagramType] = useState<'flowchart' | 'block' | 'architecture'>('flowchart');
  const nodeIdCounter = useRef(1);
  const isUpdatingFromCode = useRef(false);
  const lastGeneratedCode = useRef('');

  // Sync from code to nodes (when code changes externally)
  useEffect(() => {
    if (!code) {
      setNodes([]);
      setEdges([]);
      setIsCompatible(true);
      setDiagramType('flowchart');
      return;
    }

    // Check if it's a compatible diagram type
    const trimmed = code.trim().toLowerCase();
    let detectedType: 'flowchart' | 'block' | 'architecture' = 'flowchart';
    let compatible = false;

    if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) {
      detectedType = 'flowchart';
      compatible = true;
    } else if (trimmed.startsWith('block')) {
      detectedType = 'block';
      compatible = true;
    } else if (trimmed.startsWith('architecture')) {
      detectedType = 'architecture';
      compatible = true;
    }

    setIsCompatible(compatible);
    setDiagramType(detectedType);

    if (!compatible) {
      return;
    }

    // Don't re-parse if we just generated this code
    if (code === lastGeneratedCode.current) {
      return;
    }

    isUpdatingFromCode.current = true;
    try {
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
    } catch (error) {
      console.error('Error parsing Mermaid code:', error);
    }
    
    setTimeout(() => {
      isUpdatingFromCode.current = false;
    }, 100);
  }, [code]);

  // Sync from nodes to code (when nodes/edges change)
  const syncToCode = useCallback(() => {
    if (isUpdatingFromCode.current || !isCompatible) return;
    
    const newCode = nodesToMermaid(nodes, edges, diagramType);
    lastGeneratedCode.current = newCode;
    onCodeChange(newCode);
  }, [nodes, edges, isCompatible, onCodeChange, diagramType]);

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

  // Handle drag from palette
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

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Find intersecting nodes to check for parent
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
          ? { x: position.x - (parentGroup.position.x), y: position.y - (parentGroup.position.y) }
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
    },
    [setNodes, handleLabelChange, screenToFlowPosition, getIntersectingNodes]
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      if (node.type === 'group') return;

      const intersections = getIntersectingNodes(node);
      const parentGroup = intersections.find((n) => n.type === 'group' && n.id !== node.id);

      if (parentGroup && node.parentId !== parentGroup.id) {
        // Move into group
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              // We need relative position here
              return {
                ...n,
                parentId: parentGroup.id,
                extent: 'parent' as const,
                position: {
                   x: 50, // Default relative position inside group
                   y: 50,
                },
              };
            }
            return n;
          })
        );
      } else if (!parentGroup && node.parentId) {
        // Move out of group
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                parentId: undefined,
                extent: undefined,
                position: { x: node.position.x + 100, y: node.position.y + 100 }, // Rough absolute position
              };
            }
            return n;
          })
        );
      }
    },
    [getIntersectingNodes, setNodes]
  );

  // Delete selected nodes
  const onDelete = useCallback(() => {
    const selectedIds = nodes.filter(n => n.selected).map(n => n.id);
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter(
        (edge) => !selectedIds.includes(edge.source) && !selectedIds.includes(edge.target)
    ));
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
  const onDragStart = useCallback((event: React.DragEvent, nodeType: string, icon?: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, icon }));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // If not a flowchart, show message
  if (!isCompatible) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Designer Not Available</h3>
        <p className="text-foreground-muted max-w-md">
          The visual designer supports <strong>flowcharts</strong>, <strong>block diagrams</strong>, and <strong>architecture diagrams</strong>.
          Your current diagram type is not supported in the designer view.
        </p>
        <p className="text-sm text-foreground-muted mt-4">
          Supported diagram types: <code>flowchart TD</code>, <code>block</code>, <code>architecture-beta</code>
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Node Palette */}
      <div className="w-48 border-r border-border bg-background p-4 flex flex-col gap-4">
        {/* Diagram Type Selector */}
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
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="space-y-2 pb-4">
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
          <MiniMap
            nodeColor={(n) => {
              switch (n.type) {
                case 'database': return '#22c55e';
                case 'cloud': return '#a855f7';
                case 'user': return '#f97316';
                case 'process': return '#eab308';
                case 'server': return '#64748b';
                case 'disk': return '#6366f1';
                case 'internet': return '#06b6d4';
                case 'queue': return '#ec4899';
                case 'loadbalancer': return '#10b981';
                case 'firewall': return '#ef4444';
                case 'gateway': return '#8b5cf6';
                case 'storage': return '#f59e0b';
                case 'cache': return '#84cc16';
                case 'messagequeue': return '#f43f5e';
                case 'api': return '#14b8a6';
                case 'microservice': return '#0ea5e9';
                case 'container': return '#3b82f6';
                case 'lambda': return '#f97316';
                case 'cdn': return '#a855f7';
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
          
          <Panel position="top-center" className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-border text-foreground">
            <div className="flex items-center gap-2 text-sm">
              <ArrowRight size={14} />
              <span>Drag nodes to group them • Connect handles (T,B,L,R) • Double-click labels</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export function ArchitectureDesigner(props: ArchitectureDesignerProps) {
  return (
    <ReactFlowProvider>
      <DesignerInner {...props} />
    </ReactFlowProvider>
  );
}
