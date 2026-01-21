/**
 * Ollama API Client
 * 
 * Handles communication with local Ollama instance for LLM features.
 */

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    num_predict?: number; // Max tokens to generate
  };
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface ConnectionTestResult {
  success: boolean;
  models?: OllamaModel[];
  error?: string;
  latencyMs?: number;
}

/**
 * Normalize the Ollama endpoint URL
 */
export function normalizeEndpoint(url: string): string {
  let normalized = url.trim();
  
  // Remove trailing slash
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `http://${normalized}`;
  }
  
  return normalized;
}

/**
 * Test connection to Ollama endpoint and fetch available models
 */
export async function testOllamaConnection(endpoint: string): Promise<ConnectionTestResult> {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const startTime = performance.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${normalizedEndpoint}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        success: false,
        error: `Server returned ${response.status}: ${response.statusText}`,
      };
    }
    
    const data: OllamaTagsResponse = await response.json();
    const latencyMs = Math.round(performance.now() - startTime);
    
    return {
      success: true,
      models: data.models || [],
      latencyMs,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Connection timed out (10s). Is Ollama running?',
        };
      }
      
      // Handle common network errors with user-friendly messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          error: 'Cannot connect to Ollama. Make sure Ollama is running and the endpoint is correct.',
        };
      }
      
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}

/**
 * Generate a response from Ollama (non-streaming)
 */
export async function generateCompletion(
  endpoint: string,
  model: string,
  prompt: string,
  options?: OllamaGenerateRequest['options']
): Promise<{ success: boolean; response?: string; error?: string }> {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout
    
    const response = await fetch(`${normalizedEndpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048, // Limit response tokens for faster completion
          ...options,
        },
      } as OllamaGenerateRequest),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        success: false,
        error: `Ollama returned ${response.status}: ${response.statusText}`,
      };
    }
    
    const data: OllamaGenerateResponse = await response.json();
    
    return {
      success: true,
      response: data.response,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out (120s)',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}

/**
 * Generate a response from Ollama with streaming for better UX
 */
export async function generateCompletionStreaming(
  endpoint: string,
  model: string,
  prompt: string,
  onToken?: (token: string, accumulated: string) => void,
  options?: OllamaGenerateRequest['options']
): Promise<{ success: boolean; response?: string; error?: string }> {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout
    
    const response = await fetch(`${normalizedEndpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature: 0.7,
          num_predict: 2048,
          ...options,
        },
      } as OllamaGenerateRequest),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        success: false,
        error: `Ollama returned ${response.status}: ${response.statusText}`,
      };
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: 'No response body' };
    }
    
    const decoder = new TextDecoder();
    let accumulated = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as OllamaGenerateResponse;
          if (parsed.response) {
            accumulated += parsed.response;
            onToken?.(parsed.response, accumulated);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
    
    return {
      success: true,
      response: accumulated,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out (120s)',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error occurred',
    };
  }
}

/**
 * Format model size for display
 */
export function formatModelSize(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}
