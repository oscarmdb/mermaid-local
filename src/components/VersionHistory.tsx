/**
 * Version History Panel
 * 
 * Shows timeline of diagram versions with rollback capability.
 */

import { useState, useCallback } from 'react';
import { History, RotateCcw, Clock, X, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useDiagramVersions, rollbackToVersion, formatRelativeTime } from '@/hooks/useDatabase';
import { cn } from '@/lib/utils';

interface VersionHistoryProps {
  diagramId: string | null;
  currentVersionId: string | null;
  diagramName: string;
  isOpen: boolean;
  onClose: () => void;
  onVersionSelect?: (code: string) => void;
}

export function VersionHistory({
  diagramId,
  currentVersionId,
  diagramName,
  isOpen,
  onClose,
  onVersionSelect,
}: VersionHistoryProps) {
  const [limit, setLimit] = useState(20);
  const versions = useDiagramVersions(diagramId, limit);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  
  const handleRollback = useCallback(async (versionId: string) => {
    if (!diagramId || isRollingBack) return;
    
    if (!confirm('Restore this version? A new version will be created with the restored content.')) {
      return;
    }
    
    setIsRollingBack(true);
    try {
      await rollbackToVersion(diagramId, versionId);
    } catch (error) {
      console.error('Rollback failed:', error);
      alert('Failed to restore version');
    } finally {
      setIsRollingBack(false);
    }
  }, [diagramId, isRollingBack]);
  
  const toggleVersionExpanded = useCallback((versionId: string) => {
    setExpandedVersions(prev => {
      const next = new Set(prev);
      if (next.has(versionId)) {
        next.delete(versionId);
      } else {
        next.add(versionId);
      }
      return next;
    });
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-background border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <History size={16} className="text-primary" />
          <span className="text-sm font-semibold">Version History</span>
        </div>
        <button onClick={onClose} className="btn btn-ghost btn-icon h-7 w-7">
          <X size={16} />
        </button>
      </div>
      
      {/* Diagram name */}
      <div className="px-4 py-2 border-b border-border">
        <p className="text-xs text-foreground-muted">Diagram</p>
        <p className="text-sm font-medium truncate">{diagramName || 'Untitled'}</p>
      </div>
      
      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="p-4 text-center text-foreground-muted">
            <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No version history yet</p>
            <p className="text-xs mt-1">Changes will be saved automatically</p>
          </div>
        ) : (
          <div className="p-2">
            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
              
              {versions.map((version) => {
                const isCurrent = version.id === currentVersionId;
                const isExpanded = expandedVersions.has(version.id);
                
                return (
                  <div key={version.id} className="relative pl-7 pb-3">
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        'absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2',
                        isCurrent
                          ? 'bg-primary border-primary'
                          : version.autoSave
                          ? 'bg-background border-foreground-muted'
                          : 'bg-amber-500 border-amber-500'
                      )}
                    />
                    
                    {/* Version card */}
                    <div
                      className={cn(
                        'rounded-lg border p-2 transition-colors',
                        isCurrent
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-background-secondary border-border hover:border-foreground-muted'
                      )}
                    >
                      {/* Version header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Label or type indicator */}
                          <div className="flex items-center gap-1 mb-0.5">
                            {isCurrent && (
                              <span className="text-xs font-medium text-primary">Current</span>
                            )}
                            {!isCurrent && version.label && (
                              <>
                                <Star size={10} className="text-amber-500" />
                                <span className="text-xs font-medium truncate">{version.label}</span>
                              </>
                            )}
                            {!isCurrent && !version.label && (
                              <span className="text-xs text-foreground-muted">
                                {version.autoSave ? 'Auto-saved' : 'Manual save'}
                              </span>
                            )}
                          </div>
                          
                          {/* Timestamp */}
                          <div className="flex items-center gap-1 text-xs text-foreground-muted">
                            <Clock size={10} />
                            <span>{formatRelativeTime(version.createdAt)}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {!isCurrent && (
                            <button
                              onClick={() => handleRollback(version.id)}
                              disabled={isRollingBack}
                              className="btn btn-ghost btn-icon h-6 w-6"
                              title="Restore this version"
                            >
                              <RotateCcw size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => toggleVersionExpanded(version.id)}
                            className="btn btn-ghost btn-icon h-6 w-6"
                            title="Preview code"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded code preview */}
                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <pre className="text-xs text-foreground-muted overflow-x-auto max-h-32 overflow-y-auto">
                            {version.code.slice(0, 500)}
                            {version.code.length > 500 && '...'}
                          </pre>
                          {onVersionSelect && !isCurrent && (
                            <button
                              onClick={() => onVersionSelect(version.code)}
                              className="mt-2 text-xs text-primary hover:underline"
                            >
                              Load in editor (without saving)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Load more */}
            {versions.length >= limit && (
              <button
                onClick={() => setLimit(l => l + 20)}
                className="w-full py-2 text-sm text-primary hover:underline"
              >
                Load more...
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-border text-xs text-foreground-muted">
        <p>Auto-saves are kept for 7 days or last 50 versions.</p>
        <p>Manual saves (with labels) are kept indefinitely.</p>
      </div>
    </div>
  );
}
