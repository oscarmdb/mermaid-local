/**
 * Hook for managing Ollama settings with live queries
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db, OllamaSettings, DEFAULT_OLLAMA_SETTINGS } from '@/lib/db';
import { useCallback } from 'react';

/**
 * Get current Ollama settings with live updates
 */
export function useOllamaSettings(): OllamaSettings {
  const settings = useLiveQuery(
    () => db.ollamaSettings.get('default'),
    [],
    DEFAULT_OLLAMA_SETTINGS
  );
  
  return settings ?? DEFAULT_OLLAMA_SETTINGS;
}

/**
 * Check if LLM features are available (Ollama configured and enabled)
 */
export function useLLMAvailable(): boolean {
  const settings = useOllamaSettings();
  return settings.isEnabled && !!settings.selectedModel && !!settings.endpointUrl;
}

/**
 * Save Ollama settings to the database
 */
export async function saveOllamaSettings(settings: Partial<OllamaSettings>): Promise<void> {
  const existingSettings = await db.ollamaSettings.get('default');
  
  if (existingSettings) {
    await db.ollamaSettings.update('default', settings);
  } else {
    await db.ollamaSettings.put({
      ...DEFAULT_OLLAMA_SETTINGS,
      ...settings,
      id: 'default',
    });
  }
}

/**
 * Update available models list
 */
export async function updateAvailableModels(models: string[]): Promise<void> {
  await saveOllamaSettings({ availableModels: models });
}

/**
 * Enable or disable Ollama integration
 */
export async function setOllamaEnabled(enabled: boolean): Promise<void> {
  await saveOllamaSettings({ 
    isEnabled: enabled,
    lastConnectedAt: enabled ? new Date() : null,
  });
}

/**
 * Hook returning settings management functions
 */
export function useOllamaSettingsActions() {
  const save = useCallback(async (settings: Partial<OllamaSettings>) => {
    await saveOllamaSettings(settings);
  }, []);

  const updateModels = useCallback(async (models: string[]) => {
    await updateAvailableModels(models);
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    await setOllamaEnabled(enabled);
  }, []);

  const reset = useCallback(async () => {
    await db.ollamaSettings.put(DEFAULT_OLLAMA_SETTINGS);
  }, []);

  return {
    save,
    updateModels,
    setEnabled,
    reset,
  };
}
