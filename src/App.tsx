import { useState, useCallback } from 'react';
import Split from 'react-split';
import { Header } from '@/components/Header';
import { CodeEditor } from '@/components/CodeEditor';
import { DiagramPreview } from '@/components/DiagramPreview';
import { ExportDialog } from '@/components/ExportDialog';
import { TemplatesSidebar } from '@/components/TemplatesSidebar';
import { useDarkMode, useLocalStorage, useKeyboardShortcut } from '@/hooks/useLocalStorage';
import { defaultDiagram, DiagramTemplate } from '@/lib/templates';
import { initializeMermaid } from '@/lib/mermaid-config';

// Initialize mermaid once on app load
initializeMermaid();

function App() {
  // State
  const [isDark, toggleDarkMode] = useDarkMode();
  const [code, setCode] = useLocalStorage('mermaid-code', defaultDiagram);
  const [currentSvg, setCurrentSvg] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>();

  // Handlers
  const handleSvgGenerated = useCallback((svg: string) => {
    setCurrentSvg(svg);
  }, []);

  const handleSelectTemplate = useCallback((template: DiagramTemplate) => {
    setCode(template.code);
    setCurrentTemplateId(template.id);
  }, [setCode]);

  const handleExport = useCallback(() => {
    setShowExport(true);
  }, []);

  const handleToggleTemplates = useCallback(() => {
    setShowTemplates((prev) => !prev);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcut('e', handleExport, { ctrl: true });
  useKeyboardShortcut('e', handleExport, { meta: true });
  useKeyboardShortcut('b', handleToggleTemplates, { ctrl: true });
  useKeyboardShortcut('b', handleToggleTemplates, { meta: true });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <Header
        isDark={isDark}
        onToggleDarkMode={toggleDarkMode}
        onExport={handleExport}
        onShowTemplates={handleToggleTemplates}
        showTemplates={showTemplates}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Templates sidebar */}
        <TemplatesSidebar
          isOpen={showTemplates}
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleSelectTemplate}
          currentTemplateId={currentTemplateId}
        />

        {/* Editor and Preview split pane */}
        <div className="flex-1 overflow-hidden">
          <Split
            className="flex h-full"
            sizes={[45, 55]}
            minSize={300}
            gutterSize={4}
            direction="horizontal"
            cursor="col-resize"
          >
            {/* Code Editor */}
            <div className="h-full overflow-hidden">
              <CodeEditor
                value={code}
                onChange={setCode}
                isDark={isDark}
              />
            </div>

            {/* Diagram Preview */}
            <div className="h-full overflow-hidden">
              <DiagramPreview
                code={code}
                isDark={isDark}
                onSvgGenerated={handleSvgGenerated}
              />
            </div>
          </Split>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        svg={currentSvg}
        code={code}
      />
    </div>
  );
}

export default App;
