/**
 * Monaco Editor Setup for Offline Use
 * 
 * SECURITY: All workers are bundled locally. No external network calls.
 * This configuration ensures Monaco Editor works completely offline.
 */

import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Configure Monaco to use local workers only
// This MUST be set before monaco is used
self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

// Configure @monaco-editor/react to use our local monaco instance
// This prevents it from loading Monaco from CDN
loader.config({ monaco });

// Register Mermaid language for syntax highlighting BEFORE init
monaco.languages.register({ id: 'mermaid' });

// Mermaid syntax highlighting tokens
monaco.languages.setMonarchTokensProvider('mermaid', {
  keywords: [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
    'stateDiagram-v2', 'erDiagram', 'gantt', 'pie', 'gitGraph', 'journey',
    'mindmap', 'timeline', 'quadrantChart', 'xychart-beta', 'sankey-beta',
    'architecture-beta', 'kanban', 'block-beta',
    'subgraph', 'end', 'direction', 'participant', 'actor', 'class', 'state',
    'note', 'loop', 'alt', 'else', 'opt', 'par', 'and', 'critical', 'break',
    'rect', 'title', 'section', 'dateFormat', 'axisFormat', 'excludes',
    'includes', 'todayMarker', 'accTitle', 'accDescr',
  ],
  
  directions: ['TB', 'TD', 'BT', 'RL', 'LR'],
  
  arrowTypes: ['-->', '---', '-.->',  '-.-', '==>', '===', '--o', '--x', '<-->', 'o--o', 'x--x'],

  tokenizer: {
    root: [
      // Comments
      [/%%.*$/, 'comment'],
      
      // Directives
      [/%%\{.*?\}%%/, 'annotation'],
      
      // Keywords
      [/\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|gantt|pie|gitGraph|journey|mindmap|timeline|quadrantChart|xychart-beta|sankey-beta|architecture-beta|kanban|block-beta)\b/, 'keyword'],
      [/\b(subgraph|end|direction|participant|actor|class|state|note|loop|alt|else|opt|par|and|critical|break|rect|title|section)\b/, 'keyword'],
      
      // Directions
      [/\b(TB|TD|BT|RL|LR)\b/, 'type'],
      
      // Arrows
      [/-->|---|-.->|-\.-|==>|===|--o|--x|<-->|o--o|x--x/, 'operator'],
      [/\|>|<\||--\||--\|\||\.\.>|<\.\./, 'operator'],
      
      // Node shapes
      [/\[.*?\]/, 'string'],
      [/\(.*?\)/, 'string'],
      [/\{.*?\}/, 'string'],
      [/\[\[.*?\]\]/, 'string'],
      [/\(\(.*?\)\)/, 'string'],
      [/\[\(.*?\)\]/, 'string'],
      [/\{\{.*?\}\}/, 'string'],
      [/>.*?\]/, 'string'],
      
      // Node IDs
      [/[A-Za-z_][A-Za-z0-9_]*/, 'identifier'],
      
      // Strings
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
      
      // Numbers
      [/\d+/, 'number'],
      
      // Whitespace
      [/\s+/, 'white'],
    ],
  },
});

// Mermaid language configuration
monaco.languages.setLanguageConfiguration('mermaid', {
  comments: {
    lineComment: '%%',
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
});

// Define light and dark themes for the editor
monaco.editor.defineTheme('mermaid-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '6366f1', fontStyle: 'bold' },
    { token: 'type', foreground: '0891b2' },
    { token: 'operator', foreground: 'dc2626' },
    { token: 'string', foreground: '059669' },
    { token: 'identifier', foreground: '1e293b' },
    { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
    { token: 'number', foreground: 'd97706' },
    { token: 'annotation', foreground: '7c3aed' },
  ],
  colors: {
    'editor.background': '#f8fafc',
    'editor.foreground': '#1e293b',
    'editor.lineHighlightBackground': '#f1f5f9',
    'editor.selectionBackground': '#6366f133',
    'editorCursor.foreground': '#6366f1',
    'editorLineNumber.foreground': '#94a3b8',
    'editorLineNumber.activeForeground': '#64748b',
  },
});

monaco.editor.defineTheme('mermaid-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
    { token: 'type', foreground: '22d3ee' },
    { token: 'operator', foreground: 'f87171' },
    { token: 'string', foreground: '34d399' },
    { token: 'identifier', foreground: 'e2e8f0' },
    { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
    { token: 'number', foreground: 'fbbf24' },
    { token: 'annotation', foreground: 'a78bfa' },
  ],
  colors: {
    'editor.background': '#0f172a',
    'editor.foreground': '#e2e8f0',
    'editor.lineHighlightBackground': '#1e293b',
    'editor.selectionBackground': '#6366f144',
    'editorCursor.foreground': '#818cf8',
    'editorLineNumber.foreground': '#475569',
    'editorLineNumber.activeForeground': '#94a3b8',
  },
});

export { monaco };
