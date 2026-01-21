/**
 * Hook for managing chat history with diagrams
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { db, ChatMessage } from '@/lib/db';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook to get chat messages for a diagram
 */
export function useChatMessages(diagramId: string | null) {
  return useLiveQuery(
    async () => {
      if (!diagramId) return [];
      return db.chatMessages
        .where('diagramId')
        .equals(diagramId)
        .sortBy('createdAt');
    },
    [diagramId],
    []
  );
}

/**
 * Add a user message to chat history
 */
export async function addUserMessage(
  diagramId: string,
  content: string,
  codeSnapshot?: string
): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: generateId(),
    diagramId,
    role: 'user',
    content,
    codeSnapshot,
    createdAt: new Date(),
  };
  
  await db.chatMessages.add(message);
  return message;
}

/**
 * Add an assistant message to chat history
 */
export async function addAssistantMessage(
  diagramId: string,
  content: string,
  codeSnapshot?: string
): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: generateId(),
    diagramId,
    role: 'assistant',
    content,
    codeSnapshot,
    createdAt: new Date(),
  };
  
  await db.chatMessages.add(message);
  return message;
}

/**
 * Clear chat history for a diagram
 */
export async function clearChatHistory(diagramId: string): Promise<void> {
  await db.chatMessages.where('diagramId').equals(diagramId).delete();
}

/**
 * Delete a specific chat message
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
  await db.chatMessages.delete(messageId);
}
