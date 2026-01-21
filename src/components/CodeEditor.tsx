import { useRef, useCallback } from 'react';
import Editor, { OnMount, Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}

export function CodeEditor({ value, onChange, isDark }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Focus the editor
    editor.focus();
    
    // Add custom keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Prevent default save behavior
      // Could trigger save to localStorage here
    });
  }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Editor toolbar */}
      <div className="h-10 border-b border-border bg-background-secondary flex items-center px-3 gap-2 shrink-0">
        <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">
          Editor
        </span>
        <div className="flex-1" />
        <div className="hidden sm:flex items-center gap-2 text-xs text-foreground-muted">
          <span className="kbd">Ctrl</span>
          <span>+</span>
          <span className="kbd">E</span>
          <span>Export</span>
        </div>
      </div>
      
      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language="mermaid"
          value={value}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme={isDark ? 'mermaid-dark' : 'mermaid-light'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontLigatures: true,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
            },
            quickSuggestions: false,
            contextmenu: true,
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          loading={
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-foreground-muted">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading editor...</span>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
