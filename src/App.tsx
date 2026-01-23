import { useState, useCallback, useEffect } from 'react';
import Split from 'react-split';
import { Code, MessageSquare, Blocks } from 'lucide-react';
import { Header } from '@/components/Header';
import { ArchitectureDesigner } from '@/components/designer';
import { CodeEditor } from '@/components/CodeEditor';
import { DiagramPreview } from '@/components/DiagramPreview';
import { ExportDialog } from '@/components/ExportDialog';
import { TemplatesSidebar } from '@/components/TemplatesSidebar';
import { DiagramsSidebar } from '@/components/DiagramsSidebar';
import { VersionHistory } from '@/components/VersionHistory';
import { SettingsDialog } from '@/components/SettingsDialog';
import { GenerateMetadataDialog } from '@/components/GenerateMetadataDialog';
import { ChatTab } from '@/components/ChatTab';
import { PresenterMode } from '@/components/PresenterMode';
import { useDarkMode, useLocalStorage, useKeyboardShortcut } from '@/hooks/useLocalStorage';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useDiagram, useCurrentVersion, updateDiagram } from '@/hooks/useDatabase';
import { useLLMAvailable } from '@/hooks/useOllamaSettings';
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
  const [showSettings, setShowSettings] = useState(false);
  const [showGenerateMetadata, setShowGenerateMetadata] = useState(false);
  
  // Editor tab state (code, chat, or designer)
  const [editorTab, setEditorTab] = useState<'code' | 'chat' | 'designer'>('code');
  
  // Diagram state
  const [activeDiagramId, setActiveDiagramId] = useLocalStorage<string | null>('mermaid-active-diagram', null);
  const [code, setCode] = useLocalStorage('mermaid-code', defaultDiagram);
  const [currentSvg, setCurrentSvg] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [showPresenterMode, setShowPresenterMode] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | undefined>();
  
  // Load diagram data
  const activeDiagram = useDiagram(activeDiagramId);
  const currentVersion = useCurrentVersion(activeDiagramId);
  
  // LLM availability
  const isLLMEnabled = useLLMAvailable();
  
  // Auto-save hook
  const { saveStatus, hasUnsavedChanges, saveNow, markAsSaved } = useAutoSave({
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

  const handleApplyMetadata = useCallback(async (title: string, description: string) => {
    if (!activeDiagramId) return;
    
    await updateDiagram(activeDiagramId, { 
      name: title,
      description: description,
    });
  }, [activeDiagramId]);

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
        onShowTemplates={handleToggleSidebar}
        showTemplates={showSidebar}
        saveStatus={saveStatus}
        hasUnsavedChanges={hasUnsavedChanges}
        activeDiagramName={activeDiagram?.name}
        onShowHistory={() => setShowVersionHistory(true)}
        onManualSave={handleManualSave}
        onOpenSettings={() => setShowSettings(true)}
        isLLMEnabled={isLLMEnabled}
        onGenerateMetadata={() => setShowGenerateMetadata(true)}
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
            {/* Code Editor / Chat Panel */}
            <div className="h-full overflow-hidden flex flex-col">
              {/* Tab buttons */}
              <div className="flex border-b border-border shrink-0">
                <button
                  onClick={() => setEditorTab('code')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    editorTab === 'code'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-foreground-muted hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Code size={16} />
                  Code
                </button>
                <button
                  onClick={() => setEditorTab('chat')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    editorTab === 'chat'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-foreground-muted hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <MessageSquare size={16} />
                  Chat
                  {isLLMEnabled && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  )}
                </button>
                <button
                  onClick={() => setEditorTab('designer')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    editorTab === 'designer'
                      ? 'text-primary border-b-2 border-primary bg-primary/5'
                      : 'text-foreground-muted hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Blocks size={16} />
                  Designer
                </button>
              </div>
              
              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {editorTab === 'code' && (
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    isDark={isDark}
                  />
                )}
                {editorTab === 'chat' && (
                  <ChatTab
                    diagramId={activeDiagramId}
                    currentCode={code}
                    onCodeChange={setCode}
                    onMarkAsSaved={markAsSaved}
                    onOpenSettings={() => setShowSettings(true)}
                  />
                )}
                {editorTab === 'designer' && (
                  <ArchitectureDesigner
                    code={code}
                    onCodeChange={setCode}
                    isDark={isDark}
                  />
                )}
              </div>
            </div>

            {/* Diagram Preview */}
            <div className="h-full overflow-hidden">
              <DiagramPreview
                code={code}
                isDark={isDark}
                onSvgGenerated={handleSvgGenerated}
                onCodeFix={setCode}
                onExport={handleExport}
                onPresenterMode={() => setShowPresenterMode(true)}
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

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Generate Metadata Dialog */}
      <GenerateMetadataDialog
        isOpen={showGenerateMetadata}
        onClose={() => setShowGenerateMetadata(false)}
        code={code}
        currentTitle={activeDiagram?.name ?? ''}
        currentDescription={activeDiagram?.description ?? ''}
        onApply={handleApplyMetadata}
      />

      {/* Presenter Mode */}
      <PresenterMode
        isOpen={showPresenterMode}
        onClose={() => setShowPresenterMode(false)}
        svg={currentSvg}
        title={activeDiagram?.name}
        description={activeDiagram?.description}
        isDark={isDark}
      />
    </div>
  );
}

export default App;
