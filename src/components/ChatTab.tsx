/**
 * Chat Tab Component
 * 
 * Allows users to interact with their Mermaid diagrams through natural language.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Trash2, Loader2, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/lib/db';
import { useChatMessages, addUserMessage, addAssistantMessage, clearChatHistory } from '@/hooks/useChatHistory';
import { useOllamaSettings, useLLMAvailable } from '@/hooks/useOllamaSettings';
import { generateCompletion } from '@/lib/ollama';
import { createChatPrompt, parseChatResponse, ChatHistoryMessage } from '@/lib/llm-prompts';
import { createVersion } from '@/hooks/useDatabase';

interface ChatTabProps {
  diagramId: string | null;
  currentCode: string;
  onCodeChange: (code: string) => void;
  onMarkAsSaved: (code: string) => void;
  onOpenSettings: () => void;
}

export function ChatTab({ diagramId, currentCode, onCodeChange, onMarkAsSaved, onOpenSettings }: ChatTabProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const messages = useChatMessages(diagramId);
  const settings = useOllamaSettings();
  const isLLMAvailable = useLLMAvailable();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [diagramId]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !diagramId || isLoading) return;
    
    const userMessage = input.trim();
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      // Add user message to history
      await addUserMessage(diagramId, userMessage, currentCode);

      // Build chat history for context
      const chatHistory: ChatHistoryMessage[] = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Generate AI response
      const prompt = createChatPrompt(currentCode, userMessage, chatHistory);
      const result = await generateCompletion(
        settings.endpointUrl,
        settings.selectedModel!,
        prompt,
        {
          temperature: 0.4,
          num_predict: 2048,
        }
      );

      if (!result.success || !result.response) {
        throw new Error(result.error || 'Failed to get response');
      }

      // Parse the response
      const parsed = parseChatResponse(result.response);
      
      if (parsed) {
        // Add assistant message with explanation
        await addAssistantMessage(diagramId, parsed.explanation, parsed.code);
        
        // Create a version marked as AI-generated, with the explanation as the label
        await createVersion(diagramId, parsed.code, false, parsed.explanation, true);
        
        // Update the diagram code in the editor
        onCodeChange(parsed.code);
        
        // Mark as saved so auto-save doesn't create a duplicate
        onMarkAsSaved(parsed.code);
      } else {
        // Fallback: try to use raw response
        await addAssistantMessage(diagramId, result.response);
        setError('Could not parse response. The diagram was not updated.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Add error message to chat
      await addAssistantMessage(
        diagramId,
        `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, diagramId, isLoading, currentCode, messages, settings, onCodeChange, onMarkAsSaved]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!diagramId) return;
    if (confirm('Clear all chat history for this diagram?')) {
      await clearChatHistory(diagramId);
    }
  };

  // If no diagram is selected
  if (!diagramId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-foreground-muted">
          <Bot size={48} className="mx-auto mb-4 opacity-50" />
          <p className="font-medium">No Diagram Selected</p>
          <p className="text-sm mt-1">Select or create a diagram to start chatting</p>
        </div>
      </div>
    );
  }

  // If LLM is not available
  if (!isLLMAvailable) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Sparkles size={48} className="mx-auto mb-4 text-purple-500 opacity-50" />
          <p className="font-medium">AI Chat Not Configured</p>
          <p className="text-sm text-foreground-muted mt-1 mb-4">
            Connect to Ollama to use the chat feature
          </p>
          <button
            onClick={onOpenSettings}
            className="btn btn-primary"
          >
            Open Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/50">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-500" />
          <span className="text-sm font-medium">AI Chat</span>
          <span className="text-xs text-foreground-muted">
            ({messages.length} messages)
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="btn btn-ghost btn-icon text-foreground-muted hover:text-red-500"
            title="Clear chat history"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-foreground-muted max-w-sm">
              <Bot size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">Start a conversation</p>
              <p className="text-sm mt-1">
                Ask me to modify your diagram. For example:
              </p>
              <div className="mt-3 space-y-2">
                {[
                  'Add a new step after "Process"',
                  'Change the arrow from A to B to be dashed',
                  'Add a decision node for error handling',
                  'Make the diagram flow left to right',
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(example)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-purple-500" />
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <Loader2 size={14} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe changes to your diagram..."
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-muted resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'btn btn-primary px-4',
              (!input.trim() || isLoading) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <p className="text-xs text-foreground-muted mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

/**
 * Individual message bubble component
 */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          isUser ? 'bg-primary/10' : 'bg-purple-500/10'
        )}
      >
        {isUser ? (
          <User size={16} className="text-primary" />
        ) : (
          <Bot size={16} className="text-purple-500" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[80%] px-4 py-2 rounded-2xl text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-accent rounded-tl-sm'
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.codeSnapshot && !isUser && (
          <p className="text-xs mt-2 opacity-70">
            ✓ Diagram updated
          </p>
        )}
      </div>
    </div>
  );
}
