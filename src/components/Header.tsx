import { Sun, Moon, FileCode, Menu, X, Save, History, Check, Loader2, Circle, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveStatus } from '@/hooks/useAutoSave';

interface HeaderProps {
  isDark: boolean;
  onToggleDarkMode: () => void;
  onShowTemplates: () => void;
  showTemplates: boolean;
  saveStatus?: SaveStatus;
  hasUnsavedChanges?: boolean;
  activeDiagramName?: string;
  onShowHistory?: () => void;
  onManualSave?: () => void;
  onOpenSettings?: () => void;
  isLLMEnabled?: boolean;
  onGenerateMetadata?: () => void;
}

export function Header({
  isDark,
  onToggleDarkMode,
  onShowTemplates,
  showTemplates,
  saveStatus = 'idle',
  activeDiagramName,
  onShowHistory,
  onManualSave,
  onOpenSettings,
  isLLMEnabled = false,
  onGenerateMetadata,
}: HeaderProps) {
  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onShowTemplates}
          className={cn(
            'btn btn-ghost btn-icon lg:hidden',
            showTemplates && 'bg-accent'
          )}
          title="Toggle sidebar"
        >
          {showTemplates ? <X size={20} /> : <Menu size={20} />}
        </button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <FileCode size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Mermaid Editor</h1>
            <p className="text-xs text-foreground-muted hidden sm:block">Offline & Secure</p>
          </div>
        </div>
      </div>

      {/* Center: Active Diagram Info & Save Status */}
      <div className="hidden md:flex items-center gap-3">
        {activeDiagramName && (
          <>
            {isLLMEnabled && onGenerateMetadata ? (
              <button
                onClick={onGenerateMetadata}
                className="group flex items-center gap-1.5 hover:text-purple-500 transition-colors"
                title="Click to generate title & description with AI"
              >
                <span className="text-sm font-medium truncate max-w-[400px]">{activeDiagramName}</span>
                <Sparkles size={14} className="text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ) : (
              <span className="text-sm font-medium truncate max-w-[400px]">{activeDiagramName}</span>
            )}
            <div className="w-px h-4 bg-border" />
          </>
        )}
        
        {/* Save status indicator */}
        <div className="flex items-center gap-1.5">
          {saveStatus === 'saving' && (
            <>
              <Loader2 size={14} className="text-primary animate-spin" />
              <span className="text-xs text-foreground-muted">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-xs text-green-500">Saved</span>
            </>
          )}
          {saveStatus === 'pending' && (
            <>
              <Circle size={8} className="text-amber-500 fill-amber-500" />
              <span className="text-xs text-amber-500">Unsaved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <Circle size={8} className="text-red-500 fill-red-500" />
              <span className="text-xs text-red-500">Save failed</span>
            </>
          )}
          {saveStatus === 'idle' && !activeDiagramName && (
            <span className="text-xs text-foreground-muted">Scratch pad</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Manual save button (when diagram is active) */}
        {activeDiagramName && onManualSave && (
          <button
            onClick={onManualSave}
            className="btn btn-ghost btn-icon"
            title="Save with label (Ctrl+S)"
          >
            <Save size={18} />
          </button>
        )}

        {/* Version history button */}
        {activeDiagramName && onShowHistory && (
          <button
            onClick={onShowHistory}
            className="btn btn-ghost btn-icon"
            title="Version history"
          >
            <History size={18} />
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className={cn(
            'btn btn-ghost btn-icon relative',
            isLLMEnabled && 'text-purple-500'
          )}
          title="Settings"
        >
          <Settings size={18} />
          {isLLMEnabled && (
            <Sparkles size={10} className="absolute -top-0.5 -right-0.5 text-purple-500" />
          )}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="btn btn-ghost btn-icon"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
