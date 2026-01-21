import { Sun, Moon, Download, FileCode, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isDark: boolean;
  onToggleDarkMode: () => void;
  onExport: () => void;
  onShowTemplates: () => void;
  showTemplates: boolean;
}

export function Header({
  isDark,
  onToggleDarkMode,
  onExport,
  onShowTemplates,
  showTemplates,
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
          title="Toggle templates"
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

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Security badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-subtle" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">
            Offline Mode
          </span>
        </div>

        {/* Export button */}
        <button
          onClick={onExport}
          className="btn btn-primary"
          title="Export diagram (Ctrl+E)"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Export</span>
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
