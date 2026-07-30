import { Node, Edge } from '@xyflow/react';
import { BaseNodeData } from '../components/designer/nodes/BaseNode';

/**
 * Convert React Flow nodes and edges to Mermaid diagram syntax
 */
export function nodesToMermaid(nodes: Node[], edges: Edge[], diagramType: 'flowchart' | 'block' | 'architecture' = 'flowchart'): string {
  if (nodes.length === 0) {
    switch (diagramType) {
      case 'block':
        return 'block\n    A[Start]';
      case 'architecture':
        return 'architecture-beta\n    service A[Start]';
      case 'flowchart':
      default:
        return 'flowchart TD\n    A[Start]';
    }
  }

  const lines: string[] = [];

  // Add diagram type header
  switch (diagramType) {
    case 'block':
      lines.push('block');
      break;
    case 'architecture':
      lines.push('architecture-beta');
      break;
    case 'flowchart':
    default:
      lines.push('flowchart TD');
      break;
  }

  if (diagramType === 'architecture') {
    // Handle architecture diagram syntax
    const junctions = nodes.filter(node => node.type === 'junction');
    const groups = nodes.filter(node => node.type === 'group');
    const services = nodes.filter(node => node.type !== 'group' && node.type !== 'junction');

    const sanitizeId = (id: string): string => id.replace(/[^a-zA-Z0-9_:-]/g, '_');

    // Create groups first
    groups.forEach((group) => {
      const data = group.data as BaseNodeData;
      const icon = data.icon || getArchitectureIcon(data.nodeType);
      const parentId = group.parentId ? sanitizeId(group.parentId) : undefined;
      const inClause = parentId ? ` in ${parentId}` : '';
      lines.push(`    group ${sanitizeId(group.id)}(${icon})[${data.label}]${inClause}`);
    });

    // Create junctions
    junctions.forEach((junction) => {
      const parentId = junction.parentId ? sanitizeId(junction.parentId) : undefined;
      const inClause = parentId ? ` in ${parentId}` : '';
      lines.push(`    junction ${sanitizeId(junction.id)}${inClause}`);
    });

    // Create services
    services.forEach((service) => {
      const data = service.data as BaseNodeData;
      const icon = data.icon || getArchitectureIcon(data.nodeType);
      const parentId = service.parentId ? sanitizeId(service.parentId) : undefined;
      const inClause = parentId ? ` in ${parentId}` : '';
      lines.push(`    service ${sanitizeId(service.id)}(${icon})[${data.label}]${inClause}`);
    });

    // Create edges with directional connections
    edges.forEach((edge) => {
      const { source, target, data, animated } = edge;
      const sourceId = sanitizeId(source);
      const targetId = sanitizeId(target);
      const sourceSide = (data as any)?.sourceSide || 'R';
      const targetSide = (data as any)?.targetSide || 'L';
      const arrowSide = animated ? '>' : '';
      const arrow = `--${arrowSide}`;
      
      lines.push(`    ${sourceId}:${sourceSide} ${arrow} ${targetSide}:${targetId}`);
    });
  } else {
    // Handle flowchart/block diagram syntax
    // Node shape mapping based on type
    const getNodeShape = (node: Node): { prefix: string; suffix: string } => {
      const data = node.data as BaseNodeData | undefined;
      const nodeType = data?.nodeType || 'service';
      switch (nodeType) {
        case 'database':
          return { prefix: '[(', suffix: ')]' }; // Cylindrical
        case 'cloud':
          return { prefix: ')', suffix: '(' }; // Stadium/pill shape
        case 'user':
        case 'internet':
        case 'cdn':
          return { prefix: '((', suffix: '))' }; // Circle
        case 'process':
          return { prefix: '{', suffix: '}' }; // Rhombus/diamond
        case 'server':
          return { prefix: '[', suffix: ']' }; // Rectangle for server
        case 'queue':
          return { prefix: '([', suffix: '])' }; // Stadium shape
        case 'loadbalancer':
          return { prefix: '>', suffix: ']' }; // Triangle
        case 'gateway':
          return { prefix: '[', suffix: ']' }; // Rectangle for now
        default:
          return { prefix: '[', suffix: ']' }; // Rectangle
      }
    };

    // Create a sanitized ID from node ID
    const sanitizeId = (id: string): string => {
      return id.replace(/[^a-zA-Z0-9]/g, '_');
    };

    // Generate node definitions
    const nodeMap = new Map<string, string>();
    nodes.forEach((node) => {
      const safeId = sanitizeId(node.id);
      nodeMap.set(node.id, safeId);
      const { prefix, suffix } = getNodeShape(node);
      const data = node.data as BaseNodeData | undefined;
      const label = data?.label || 'Node';
      // Escape special characters in label
      const escapedLabel = label.replace(/"/g, '\\"');
      lines.push(`    ${safeId}${prefix}"${escapedLabel}"${suffix}`);
    });

    // Generate edge definitions
    edges.forEach((edge) => {
      const sourceId = nodeMap.get(edge.source);
      const targetId = nodeMap.get(edge.target);
      if (sourceId && targetId) {
        const label = edge.label ? `|"${edge.label}"| ` : '';
        const arrow = edge.animated ? '-.->' : '-->';
        lines.push(`    ${sourceId} ${arrow} ${label}${targetId}`);
      }
    });
  }

  return lines.join('\n');
}

/**
 * Get appropriate icon for architecture diagrams
 */
function getArchitectureIcon(nodeType: string): string {
  switch (nodeType) {
    case 'database':
      return 'database';
    case 'cloud':
      return 'cloud';
    case 'server':
      return 'server';
    case 'disk':
    case 'storage':
      return 'disk';
    case 'internet':
    case 'cdn':
      return 'internet';
    case 'user':
      return 'lucide:user';
    case 'group':
      return 'lucide:box';
    default:
      return 'server';
  }
}

export function mermaidToNodes(code: string): { nodes: Node[]; edges: Edge[] } {
  // Check diagram type
  const trimmed = code.trim().toLowerCase();
  const isArchitecture = trimmed.startsWith('architecture-beta');

  if (isArchitecture) {
    return parseArchitectureDiagram(code);
  } else {
    return parseFlowchartDiagram(code);
  }
}

/**
 * Parse architecture-beta diagram syntax
 */
function parseArchitectureDiagram(code: string): { nodes: Node[]; edges: Edge[] } {
  const edges: Edge[] = [];
  const nodes: Node[] = [];

  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('architecture-beta') && !l.startsWith('%%'));

  // Regular expressions for architecture syntax
  const groupRegex = /^group\s+([A-Za-z0-9_:-]+)\s*(?:\(([^)]+)\))?\s*\[([^\]]+)\](?:\s+in\s+([A-Za-z0-9_:-]+))?$/;
  const serviceRegex = /^service\s+([A-Za-z0-9_:-]+)\s*(?:\(([^)]+)\))?\s*\[([^\]]+)\](?:\s+in\s+([A-Za-z0-9_:-]+))?$/;
  const junctionRegex = /^junction\s+([A-Za-z0-9_:-]+)(?:\s+in\s+([A-Za-z0-9_:-]+))?$/;
  const edgeRegex = /^([A-Za-z0-9_:-]+)(?:\{group\})?:([TBLR])\s*(<?--?>?)\s*([TBLR]):([A-Za-z0-9_:-]+)(?:\{group\})?$/;

  // Track parent relationships for positioning
  const parentMap = new Map<string, string>();

  // Parse nodes first
  for (const line of lines) {
    // Parse groups
    const groupMatch = line.match(groupRegex);
    if (groupMatch) {
      const [, id, icon, label, parentId] = groupMatch;
      nodes.push({
        id,
        type: 'group',
        position: { x: Math.random() * 400, y: Math.random() * 300 },
        parentId,
        extent: 'parent',
        data: {
          label,
          nodeType: 'group',
          icon: icon || 'cloud',
        },
      });
      if (parentId) parentMap.set(id, parentId);
      continue;
    }

    // Parse services
    const serviceMatch = line.match(serviceRegex);
    if (serviceMatch) {
      const [, id, icon, label, parentId] = serviceMatch;
      const nodeType = getNodeTypeFromIcon(icon || 'server');
      nodes.push({
        id,
        type: nodeType,
        position: { x: Math.random() * 400, y: Math.random() * 300 },
        parentId,
        extent: parentId ? 'parent' : undefined,
        data: {
          label,
          nodeType,
          icon: icon, // Store original icon name
        },
      });
      if (parentId) parentMap.set(id, parentId);
      continue;
    }

    // Parse junctions
    const junctionMatch = line.match(junctionRegex);
    if (junctionMatch) {
      const [, id, parentId] = junctionMatch;
      nodes.push({
        id,
        type: 'junction',
        position: { x: Math.random() * 400, y: Math.random() * 300 },
        parentId,
        extent: parentId ? 'parent' : undefined,
        data: {
          label: '',
          nodeType: 'junction',
        },
      });
      if (parentId) parentMap.set(id, parentId);
      continue;
    }

    // Parse edges
    const edgeMatch = line.match(edgeRegex);
    if (edgeMatch) {
      const [, sourceId, sourceSide, arrow, targetSide, targetId] = edgeMatch;
      edges.push({
        id: `e-${sourceId}-${targetId}-${sourceSide}-${targetSide}`,
        source: sourceId,
        target: targetId,
        animated: arrow?.includes('>'),
        data: {
          sourceSide,
          targetSide,
        },
      });
    }
  }

  return { nodes, edges };
}

/**
 * Parse flowchart/block diagram syntax (existing logic)
 */
function parseFlowchartDiagram(code: string): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, { id: string; label: string; type: BaseNodeData['nodeType'] }>();

  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('flowchart') && !l.startsWith('block') && !l.startsWith('%%'));

  // Regular expressions for parsing
  const nodeDefRegex = /^([A-Za-z0-9_]+)\s*(\[{1,2}|\({1,2}|\{{1}|>\[?)([^\]\)\}]+)(\]{1,2}|\){1,2}|\}{1}|\])?$/;
  const edgeRegex = /^([A-Za-z0-9_]+)\s*(-->|---->|-.->|-.-|--)\s*(\|[^|]+\|)?\s*([A-Za-z0-9_]+)$/;
  const combinedRegex = /^([A-Za-z0-9_]+)\s*(\[{1,2}|\({1,2}|\{{1})?([^\]\)\}\-]+)?(\]{1,2}|\){1,2}|\}{1})?\s*(-->|---->|-.->|-.-|--)\s*(\|[^|]+\|)?\s*([A-Za-z0-9_]+)\s*(\[{1,2}|\({1,2}|\{{1})?([^\]\)\}]+)?(\]{1,2}|\){1,2}|\}{1})?$/;

  // Determine node type from brackets
  const getNodeTypeFromBrackets = (prefix: string): BaseNodeData['nodeType'] => {
    if (prefix?.includes('[(')) return 'database';
    if (prefix?.includes('((')) return 'user'; // Could be user, internet, or cdn - default to user
    if (prefix?.includes('{')) return 'process';
    if (prefix?.includes(')') || prefix?.includes('([')) return 'cloud';
    return 'service'; // Default for rectangles
  };

  // Process each line
  for (const line of lines) {
    // Try combined syntax (A[Label] --> B[Label])
    const combinedMatch = line.match(combinedRegex);
    if (combinedMatch) {
      const [, sourceId, sourcePrefix, sourceLabel, , arrow, edgeLabel, targetId, targetPrefix, targetLabel] = combinedMatch;

      // Add source node if not exists
      if (!nodeMap.has(sourceId)) {
        const type = getNodeTypeFromBrackets(sourcePrefix || '[');
        const label = sourceLabel?.replace(/"/g, '').trim() || sourceId;
        nodeMap.set(sourceId, { id: sourceId, label, type });
      }

      // Add target node if not exists
      if (!nodeMap.has(targetId)) {
        const type = getNodeTypeFromBrackets(targetPrefix || '[');
        const label = targetLabel?.replace(/"/g, '').trim() || targetId;
        nodeMap.set(targetId, { id: targetId, label, type });
      }

      // Add edge
      edges.push({
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        animated: arrow?.includes('-.'),
        label: edgeLabel?.replace(/\|/g, '').replace(/"/g, '').trim(),
      });
      continue;
    }

    // Try standalone edge
    const edgeMatch = line.match(edgeRegex);
    if (edgeMatch) {
      const [, sourceId, arrow, edgeLabel, targetId] = edgeMatch;

      // Ensure nodes exist
      if (!nodeMap.has(sourceId)) {
        nodeMap.set(sourceId, { id: sourceId, label: sourceId, type: 'service' });
      }
      if (!nodeMap.has(targetId)) {
        nodeMap.set(targetId, { id: targetId, label: targetId, type: 'service' });
      }

      edges.push({
        id: `e-${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        animated: arrow?.includes('-.'),
        label: edgeLabel?.replace(/\|/g, '').replace(/"/g, '').trim(),
      });
      continue;
    }

    // Try standalone node definition
    const nodeMatch = line.match(nodeDefRegex);
    if (nodeMatch) {
      const [, id, prefix, label] = nodeMatch;
      const type = getNodeTypeFromBrackets(prefix);
      const cleanLabel = label?.replace(/"/g, '').trim() || id;
      nodeMap.set(id, { id, label: cleanLabel, type });
    }
  }

  // Convert node map to array with positions
  let x = 50;
  let y = 50;
  let col = 0;
  const NODES_PER_ROW = 3;
  const X_SPACING = 200;
  const Y_SPACING = 150;

  nodeMap.forEach((nodeData) => {
    nodes.push({
      id: nodeData.id,
      type: nodeData.type,
      position: { x, y },
      data: {
        label: nodeData.label,
        nodeType: nodeData.type,
      },
    });

    col++;
    if (col >= NODES_PER_ROW) {
      col = 0;
      x = 50;
      y += Y_SPACING;
    } else {
      x += X_SPACING;
    }
  });

  return { nodes, edges };
}

/**
 * Get node type from architecture icon
 */
function getNodeTypeFromIcon(icon: string): BaseNodeData['nodeType'] {
  if (!icon) return 'service';
  
  const cleanIcon = icon.startsWith('lucide:') ? icon.replace('lucide:', '') : icon;
  
  switch (cleanIcon) {
    case 'database':
      return 'database';
    case 'cloud':
      return 'cloud';
    case 'server':
      return 'server';
    case 'disk':
    case 'hard-drive':
      return 'disk';
    case 'globe':
    case 'internet':
      return 'internet';
    case 'user':
      return 'user';
    case 'box':
    case 'group':
      return 'group';
    default:
      // Check for logos
      if (icon.startsWith('logos:')) {
        if (icon.includes('database') || icon.includes('aurora') || icon.includes('dynamodb')) return 'database';
        if (icon.includes('cloud')) return 'cloud';
        if (icon.includes('server') || icon.includes('ec2')) return 'server';
        if (icon.includes('s3') || icon.includes('storage')) return 'disk';
      }
      return 'service';
  }
}



