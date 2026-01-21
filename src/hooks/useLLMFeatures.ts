/**
 * Hook for LLM-powered features
 */

import { useState, useCallback } from 'react';
import { useOllamaSettings, useLLMAvailable } from './useOllamaSettings';
import { generateCompletion } from '@/lib/ollama';
import { 
  createFixErrorPrompt, 
  createGenerateMetadataPrompt, 
  parseMetadataResponse, 
  cleanFixedCode 
} from '@/lib/llm-prompts';

export type LLMRequestStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseLLMFeaturesReturn {
  isAvailable: boolean;
  
  // Fix syntax errors
  fixError: (code: string, error: string) => Promise<string | null>;
  fixStatus: LLMRequestStatus;
  fixErrorMessage: string | null;
  
  // Generate metadata
  generateMetadata: (code: string) => Promise<{ title: string; description: string } | null>;
  metadataStatus: LLMRequestStatus;
  metadataErrorMessage: string | null;
}

export function useLLMFeatures(): UseLLMFeaturesReturn {
  const settings = useOllamaSettings();
  const isAvailable = useLLMAvailable();
  
  // Fix error state
  const [fixStatus, setFixStatus] = useState<LLMRequestStatus>('idle');
  const [fixErrorMessage, setFixErrorMessage] = useState<string | null>(null);
  
  // Metadata state
  const [metadataStatus, setMetadataStatus] = useState<LLMRequestStatus>('idle');
  const [metadataErrorMessage, setMetadataErrorMessage] = useState<string | null>(null);

  /**
   * Fix a Mermaid syntax error using LLM
   */
  const fixError = useCallback(async (code: string, error: string): Promise<string | null> => {
    if (!isAvailable || !settings.selectedModel) {
      setFixErrorMessage('LLM not configured');
      return null;
    }
    
    setFixStatus('loading');
    setFixErrorMessage(null);
    
    try {
      const prompt = createFixErrorPrompt(code, error);
      const result = await generateCompletion(
        settings.endpointUrl,
        settings.selectedModel,
        prompt,
        { 
          temperature: 0.1, // Very low temperature for deterministic fixes
          num_predict: 1024, // Limit response - we only need the fixed code
        }
      );
      
      if (!result.success || !result.response) {
        setFixStatus('error');
        setFixErrorMessage(result.error || 'Failed to get response');
        return null;
      }
      
      const fixedCode = cleanFixedCode(result.response);
      setFixStatus('success');
      return fixedCode;
    } catch (err) {
      setFixStatus('error');
      setFixErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [isAvailable, settings.endpointUrl, settings.selectedModel]);

  /**
   * Generate title and description for a diagram
   */
  const generateMetadata = useCallback(async (code: string): Promise<{ title: string; description: string } | null> => {
    if (!isAvailable || !settings.selectedModel) {
      setMetadataErrorMessage('LLM not configured');
      return null;
    }
    
    if (!code.trim()) {
      setMetadataErrorMessage('No diagram code provided');
      return null;
    }
    
    setMetadataStatus('loading');
    setMetadataErrorMessage(null);
    
    try {
      const prompt = createGenerateMetadataPrompt(code);
      const result = await generateCompletion(
        settings.endpointUrl,
        settings.selectedModel,
        prompt,
        { temperature: 0.7 }
      );
      
      if (!result.success || !result.response) {
        setMetadataStatus('error');
        setMetadataErrorMessage(result.error || 'Failed to get response');
        return null;
      }
      
      const metadata = parseMetadataResponse(result.response);
      
      if (!metadata) {
        setMetadataStatus('error');
        setMetadataErrorMessage('Failed to parse LLM response');
        return null;
      }
      
      setMetadataStatus('success');
      return metadata;
    } catch (err) {
      setMetadataStatus('error');
      setMetadataErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [isAvailable, settings.endpointUrl, settings.selectedModel]);

  return {
    isAvailable,
    fixError,
    fixStatus,
    fixErrorMessage,
    generateMetadata,
    metadataStatus,
    metadataErrorMessage,
  };
}
