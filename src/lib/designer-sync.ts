import { Node, Edge } from '@xyflow/react';
import { BaseNodeData } from '../components/designer/nodes/BaseNode';

/**
 * Convert React Flow nodes and edges to Mermaid flowchart syntax
 */
export function nodesToMermaid(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) {
    return 'flowchart TD\n    A[Start]';
  }

  const lines: string[] = ['flowchart TD'];
  
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
        return { prefix: '((', suffix: '))' }; // Circle
      case 'process':
        return { prefix: '{', suffix: '}' }; // Rhombus/diamond
      case 'service':
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

  return lines.join('\n');
}

/**
 * Parse Mermaid flowchart code to React Flow nodes and edges
 * This is a simplified parser that handles basic flowchart syntax
 */
export function mermaidToNodes(code: string): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, { id: string; label: string; type: BaseNodeData['nodeType'] }>();

  const lines = code.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('flowchart') && !l.startsWith('%%'));

  // Regular expressions for parsing
  const nodeDefRegex = /^([A-Za-z0-9_]+)\s*(\[{1,2}|\({1,2}|\{{1}|>\[?)([^\]\)\}]+)(\]{1,2}|\){1,2}|\}{1}|\])?$/;
  const edgeRegex = /^([A-Za-z0-9_]+)\s*(-->|---->|-.->|-.-|--)\s*(\|[^|]+\|)?\s*([A-Za-z0-9_]+)$/;
  const combinedRegex = /^([A-Za-z0-9_]+)\s*(\[{1,2}|\({1,2}|\{{1})?([^\]\)\}\-]+)?(\]{1,2}|\){1,2}|\}{1})?\s*(-->|---->|-.->|-.-|--)\s*(\|[^|]+\|)?\s*([A-Za-z0-9_]+)\s*(\[{1,2}|\({1,2}|\{{1})?([^\]\)\}]+)?(\]{1,2}|\){1,2}|\}{1})?$/;

  // Determine node type from brackets
  const getNodeTypeFromBrackets = (prefix: string): BaseNodeData['nodeType'] => {
    if (prefix?.includes('[(')) return 'database';
    if (prefix?.includes('((')) return 'user';
    if (prefix?.includes('{')) return 'process';
    if (prefix?.includes(')') || prefix?.includes('([')) return 'cloud';
    return 'service';
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
 * Check if code is a flowchart that can be edited in designer
 */
export function isFlowchart(code: string): boolean {
  const trimmed = code.trim().toLowerCase();
  return trimmed.startsWith('flowchart') || trimmed.startsWith('graph');
}
