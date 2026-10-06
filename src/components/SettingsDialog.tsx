/**
 * Settings Dialog Component
 * 
 * Allows users to configure Ollama LLM integration.
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  X, 
  Settings2, 
  Server, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useOllamaSettings, useOllamaSettingsActions } from '@/hooks/useOllamaSettings';
import { testOllamaConnection, formatModelSize, normalizeEndpoint, OllamaModel } from '@/lib/ollama';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'failed';

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const settings = useOllamaSettings();
  const { save, setEnabled } = useOllamaSettingsActions();
  
  // Local state for form
  const [endpointUrl, setEndpointUrl] = useState(settings.endpointUrl);
  const [selectedModel, setSelectedModel] = useState<string | null>(settings.selectedModel);
  const [availableModels, setAvailableModels] = useState<OllamaModel[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sync local state with settings when dialog opens
  useEffect(() => {
    if (isOpen) {
      setEndpointUrl(settings.endpointUrl);
      setSelectedModel(settings.selectedModel);
      setConnectionStatus(settings.isEnabled ? 'connected' : 'idle');
      
      // If already enabled, refresh models
      if (settings.isEnabled) {
        handleTestConnection(settings.endpointUrl, false);
      }
    }
    // handleTestConnection is intentionally omitted - it's recreated on every
    // endpointUrl keystroke, and including it would re-trigger this effect
    // and re-test the connection while the user is still typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settings.endpointUrl, settings.selectedModel, settings.isEnabled]);

  const handleTestConnection = useCallback(async (endpoint?: string, showLoading = true) => {
    const url = endpoint ?? endpointUrl;
    
    if (showLoading) {
      setConnectionStatus('testing');
    }
    setConnectionError(null);
    setLatencyMs(null);
    
    const result = await testOllamaConnection(url);
    
    if (result.success) {
      setConnectionStatus('connected');
      setAvailableModels(result.models || []);
      setLatencyMs(result.latencyMs ?? null);
      
      // If no model selected, select the first one
      if (!selectedModel && result.models && result.models.length > 0) {
        setSelectedModel(result.models[0].name);
      }
    } else {
      setConnectionStatus('failed');
      setConnectionError(result.error || 'Connection failed');
      setAvailableModels([]);
    }
  }, [endpointUrl, selectedModel]);

  const handleSaveSettings = useCallback(async () => {
    if (connectionStatus !== 'connected' || !selectedModel) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const normalizedUrl = normalizeEndpoint(endpointUrl);
      await save({
        endpointUrl: normalizedUrl,
        selectedModel,
        availableModels: availableModels.map(m => m.name),
        isEnabled: true,
        lastConnectedAt: new Date(),
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  }, [endpointUrl, selectedModel, availableModels, connectionStatus, save, onClose]);

  const handleDisable = useCallback(async () => {
    await setEnabled(false);
    setConnectionStatus('idle');
    setSelectedModel(null);
    onClose();
  }, [setEnabled, onClose]);

  if (!isOpen) return null;

  const isConnected = connectionStatus === 'connected';
  const canSave = isConnected && !!selectedModel;

  return (
    <>
      {/* Backdrop */}
      <div
        className="dialog-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="dialog-content max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Settings2 size={20} className="text-white" />
            </div>
            <div>
              <h2 id="settings-title" className="text-xl font-semibold">Settings</h2>
              <p className="text-sm text-foreground-muted">Configure LLM integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* LLM Features Info */}
          <div className="rounded-lg border border-border bg-accent/30 p-4">
            <div className="flex items-start gap-3">
              <Sparkles size={20} className="text-purple-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-sm">LLM Features</h3>
                <p className="text-xs text-foreground-muted mt-1">
                  Connect to a local Ollama instance to unlock AI-powered features:
                </p>
                <ul className="text-xs text-foreground-muted mt-2 space-y-1">
                  <li>• Debug and fix Mermaid syntax errors automatically</li>
                  <li>• Generate titles and descriptions for diagrams</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Ollama Endpoint */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Server size={16} />
              Ollama Endpoint
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={endpointUrl}
                onChange={(e) => {
                  setEndpointUrl(e.target.value);
                  setConnectionStatus('idle');
                }}
                placeholder="http://localhost:11434"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={() => handleTestConnection()}
                disabled={connectionStatus === 'testing' || !endpointUrl}
                className="btn btn-secondary px-4"
              >
                {connectionStatus === 'testing' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Test'
                )}
              </button>
            </div>
            
            {/* Connection Status */}
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 size={16} />
                <span>Connected{latencyMs ? ` (${latencyMs}ms)` : ''}</span>
              </div>
            )}
            
            {connectionStatus === 'failed' && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <span>{connectionError || 'Connection failed'}</span>
              </div>
            )}
          </div>

          {/* Model Selection */}
          {isConnected && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Cpu size={16} />
                  Select Model
                </label>
                <button
                  onClick={() => handleTestConnection(undefined, true)}
                  className="text-xs text-foreground-muted hover:text-foreground flex items-center gap-1"
                  title="Refresh models"
                >
                  <RefreshCw size={12} />
                  Refresh
                </button>
              </div>
              
              {availableModels.length === 0 ? (
                <div className="rounded-lg border border-border bg-accent/30 p-4 text-center">
                  <AlertTriangle size={20} className="mx-auto text-amber-500 mb-2" />
                  <p className="text-sm text-foreground-muted">
                    No models found. Install a model using:
                  </p>
                  <code className="text-xs bg-background px-2 py-1 rounded mt-2 inline-block">
                    ollama pull llama3.2
                  </code>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableModels.map((model) => (
                    <label
                      key={model.name}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedModel === model.name
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-accent/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="model"
                        value={model.name}
                        checked={selectedModel === model.name}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        selectedModel === model.name
                          ? 'border-primary'
                          : 'border-foreground-muted'
                      }`}>
                        {selectedModel === model.name && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{model.name}</div>
                        <div className="text-xs text-foreground-muted">
                          {formatModelSize(model.size)}
                          {model.details?.parameter_size && ` • ${model.details.parameter_size}`}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Current Status */}
          {settings.isEnabled && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 size={16} />
                <span>LLM features enabled using <strong>{settings.selectedModel}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-between mt-6 pt-4 border-t border-border">
          <div>
            {settings.isEnabled && (
              <button
                onClick={handleDisable}
                className="btn btn-ghost text-red-500 hover:text-red-600 hover:bg-red-500/10"
              >
                Disable LLM
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={!canSave || isSaving}
              className="btn btn-primary"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Enable'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
