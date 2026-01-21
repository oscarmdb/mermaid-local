import { useState, useCallback, useEffect } from 'react';
import Split from 'react-split';
import { Header } from '@/components/Header';
import { CodeEditor } from '@/components/CodeEditor';
import { DiagramPreview } from '@/components/DiagramPreview';
import { ExportDialog } from '@/components/ExportDialog';
import { TemplatesSidebar } from '@/components/TemplatesSidebar';
import { DiagramsSidebar } from '@/components/DiagramsSidebar';
import { VersionHistory } from '@/components/VersionHistory';
import { useDarkMode, useLocalStorage, useKeyboardShortcut } from '@/hooks/useLocalStorage';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useDiagram, useCurrentVersion } from '@/hooks/useDatabase';
import { defaultDiagram, DiagramTemplate } from '@/lib/templates';
import { initializeMermaid } from '@/lib/mermaid-config';
import { db } from '@/lib/db';

// Initialize mermaid once on app load
initializeMermaid();

function App() {
  // Theme state
  const [isDark, toggleDarkMode] = useDarkMode();
  
  // Sidebar state
  const [sidebarView, setSidebarView] = useState<'diagrams' | 'templates'>('diagrams');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Diagram state
  const [activeDiagramId, setActiveDiagramId] = useLocalStorage<string | null>('mermaid-active-diagram', null);
  const [code, setCode] = useLocalStorage('mermaid-code', defaultDiagram);
  const [currentSvg, setCurrentSvg] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>();
  
  // Load diagram data
  const activeDiagram = useDiagram(activeDiagramId);
  const currentVersion = useCurrentVersion(activeDiagramId);
  
  // Auto-save hook
  const { saveStatus, hasUnsavedChanges, saveNow } = useAutoSave({
    diagramId: activeDiagramId,
    code,
    enabled: !!activeDiagramId,
  });
  
  // Load diagram content when diagram or version changes
  useEffect(() => {
    if (currentVersion?.code && currentVersion.code !== code) {
      setCode(currentVersion.code);
    }
  }, [currentVersion?.id]); // Only depend on version ID to avoid loops
  
  // Handlers
  const handleSvgGenerated = useCallback((svg: string) => {
    setCurrentSvg(svg);
  }, []);

  const handleSelectTemplate = useCallback((template: DiagramTemplate) => {
    setCode(template.code);
    setCurrentTemplateId(template.id);
    // Clear active diagram when using a template (scratch mode)
    setActiveDiagramId(null);
  }, [setCode, setActiveDiagramId]);

  const handleSelectDiagram = useCallback(async (diagramId: string) => {
    // Load the diagram
    const diagram = await db.diagrams.get(diagramId);
    if (diagram?.currentVersionId) {
      const version = await db.diagramVersions.get(diagram.currentVersionId);
      if (version) {
        setCode(version.code);
      }
    }
    setActiveDiagramId(diagramId);
    setCurrentTemplateId(undefined);
  }, [setCode, setActiveDiagramId]);

  const handleNewDiagram = useCallback((diagramId: string) => {
    setActiveDiagramId(diagramId);
    setCode(''); // Start with empty editor
    setCurrentTemplateId(undefined);
  }, [setActiveDiagramId, setCode]);

  const handleExport = useCallback(() => {
    setShowExport(true);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  const handleManualSave = useCallback(async () => {
    if (!activeDiagramId) {
      alert('Please save this diagram to a customer/application first.');
      return;
    }
    
    const label = prompt('Version label (optional):');
    await saveNow(label || undefined);
  }, [activeDiagramId, saveNow]);

  // Keyboard shortcuts
  useKeyboardShortcut('e', handleExport, { ctrl: true });
  useKeyboardShortcut('e', handleExport, { meta: true });
  useKeyboardShortcut('b', handleToggleSidebar, { ctrl: true });
  useKeyboardShortcut('b', handleToggleSidebar, { meta: true });
  useKeyboardShortcut('s', handleManualSave, { ctrl: true });
  useKeyboardShortcut('s', handleManualSave, { meta: true });

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <Header
        isDark={isDark}
        onToggleDarkMode={toggleDarkMode}
        onExport={handleExport}
        onShowTemplates={handleToggleSidebar}
        showTemplates={showSidebar}
        saveStatus={saveStatus}
        hasUnsavedChanges={hasUnsavedChanges}
        activeDiagramName={activeDiagram?.name}
        onShowHistory={() => setShowVersionHistory(true)}
        onManualSave={handleManualSave}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar tabs */}
        {showSidebar && (
          <div className="w-72 flex flex-col border-r border-border">
            {/* Tab buttons */}
            <div className="flex border-b border-border">
              <button
                onClick={() => setSidebarView('diagrams')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  sidebarView === 'diagrams'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-foreground-muted hover:text-foreground hover:bg-accent'
                }`}
              >
                My Diagrams
              </button>
              <button
                onClick={() => setSidebarView('templates')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  sidebarView === 'templates'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-foreground-muted hover:text-foreground hover:bg-accent'
                }`}
              >
                Templates
              </button>
            </div>
            
            {/* Sidebar content */}
            <div className="flex-1 overflow-hidden">
              {sidebarView === 'diagrams' ? (
                <DiagramsSidebar
                  activeDiagramId={activeDiagramId}
                  onSelectDiagram={handleSelectDiagram}
                  onNewDiagram={handleNewDiagram}
                />
              ) : (
                <TemplatesSidebar
                  onSelectTemplate={handleSelectTemplate}
                  currentTemplateId={currentTemplateId}
                />
              )}
            </div>
          </div>
        )}

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
      
      {/* Version History Panel */}
      <VersionHistory
        diagramId={activeDiagramId}
        currentVersionId={activeDiagram?.currentVersionId ?? null}
        diagramName={activeDiagram?.name ?? 'Untitled'}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onVersionSelect={(versionCode) => setCode(versionCode)}
      />
    </div>
  );
}

export default App;
