/**
 * Auto-Save Hook
 * 
 * Provides intelligent auto-save functionality with debouncing
 * and minimum change threshold detection.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { createVersion } from '@/hooks/useDatabase';

// Auto-save configuration
const AUTO_SAVE_DEBOUNCE_MS = 1500; // Wait 1.5s after typing stops
const MIN_CHANGE_THRESHOLD = 5;     // Minimum characters changed to trigger save

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  diagramId: string | null;
  code: string;
  enabled?: boolean;
  onSaveComplete?: () => void;
  onError?: (error: Error) => void;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  saveNow: (label?: string) => Promise<void>;
}

export function useAutoSave({
  diagramId,
  code,
  enabled = true,
  onSaveComplete,
  onError,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const lastSavedCodeRef = useRef<string>(code);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  
  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Calculate if code has changed enough to warrant a save
  const hasSignificantChange = useCallback((newCode: string, oldCode: string): boolean => {
    if (newCode === oldCode) return false;
    
    const lengthDiff = Math.abs(newCode.length - oldCode.length);
    if (lengthDiff >= MIN_CHANGE_THRESHOLD) return true;
    
    // Count character differences (simple diff)
    let differences = 0;
    const maxLen = Math.max(newCode.length, oldCode.length);
    for (let i = 0; i < maxLen && differences < MIN_CHANGE_THRESHOLD; i++) {
      if (newCode[i] !== oldCode[i]) {
        differences++;
      }
    }
    
    return differences >= MIN_CHANGE_THRESHOLD;
  }, []);
  
  // Perform the actual save
  const performSave = useCallback(async (isAutoSave: boolean, label?: string) => {
    if (!diagramId || !isMountedRef.current) return;
    
    const codeToSave = code;
    
    // Don't save if no significant changes (unless it's a manual save with label)
    if (isAutoSave && !hasSignificantChange(codeToSave, lastSavedCodeRef.current)) {
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      return;
    }
    
    setSaveStatus('saving');
    
    try {
      await createVersion(diagramId, codeToSave, isAutoSave, label);
      
      if (isMountedRef.current) {
        lastSavedCodeRef.current = codeToSave;
        setLastSavedAt(new Date());
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
        onSaveComplete?.();
        
        // Reset to idle after showing "saved" briefly
        setTimeout(() => {
          if (isMountedRef.current) {
            setSaveStatus('idle');
          }
        }, 2000);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setSaveStatus('error');
        onError?.(error instanceof Error ? error : new Error('Save failed'));
      }
    }
  }, [diagramId, code, hasSignificantChange, onSaveComplete, onError]);
  
  // Manual save function
  const saveNow = useCallback(async (label?: string) => {
    // Clear any pending auto-save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    await performSave(false, label);
  }, [performSave]);
  
  // Auto-save effect with debouncing
  useEffect(() => {
    if (!enabled || !diagramId) return;
    
    // Check for changes
    if (code !== lastSavedCodeRef.current) {
      setHasUnsavedChanges(true);
      setSaveStatus('pending');
      
      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        performSave(true);
      }, AUTO_SAVE_DEBOUNCE_MS);
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [code, diagramId, enabled, performSave]);
  
  // Update lastSavedCode when diagram changes
  useEffect(() => {
    if (diagramId) {
      // Reset state when switching diagrams
      lastSavedCodeRef.current = code;
      setHasUnsavedChanges(false);
      setSaveStatus('idle');
    }
  }, [diagramId]); // Only reset when diagram ID changes, not code
  
  return {
    saveStatus,
    lastSavedAt,
    hasUnsavedChanges,
    saveNow,
  };
}
