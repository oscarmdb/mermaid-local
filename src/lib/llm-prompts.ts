/**
 * LLM Prompt Templates for Mermaid diagram features
 */

/**
 * Prompt to fix Mermaid syntax errors
 * Kept concise to minimize tokens and speed up response
 */
export function createFixErrorPrompt(code: string, error: string): string {
  return `Fix this Mermaid diagram syntax error. Return ONLY the corrected code, no explanation.

Error: ${error}

Code:
${code}

Fixed code:`;
}

/**
 * Prompt to generate a title and description for a diagram
 */
export function createGenerateMetadataPrompt(code: string): string {
  return `You are analyzing a Mermaid diagram to generate a concise title and description.

## Mermaid Code:
\`\`\`mermaid
${code}
\`\`\`

## Instructions:
Generate a JSON object with:
1. "title": A short, descriptive title (3-7 words) that captures what the diagram represents
2. "description": A brief description (1-2 sentences) explaining the diagram's purpose and key elements

Respond ONLY with valid JSON in this exact format:
{"title": "Your Title Here", "description": "Your description here."}`;
}

/**
 * Parse the metadata response from LLM
 */
export function parseMetadataResponse(response: string): { title: string; description: string } | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (typeof parsed.title === 'string' && typeof parsed.description === 'string') {
      return {
        title: parsed.title.trim(),
        description: parsed.description.trim(),
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Clean up the LLM response for fixed code
 */
export function cleanFixedCode(response: string): string {
  let code = response.trim();
  
  // Remove markdown code fences if present
  code = code.replace(/^```(?:mermaid)?\s*\n?/i, '');
  code = code.replace(/\n?```\s*$/i, '');
  
  return code.trim();
}

/**
 * Chat message structure for building prompts
 */
export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Create a chat prompt for modifying Mermaid diagrams
 * Includes conversation history for context
 */
export function createChatPrompt(
  currentCode: string,
  userMessage: string,
  chatHistory: ChatHistoryMessage[] = []
): string {
  // Build conversation history (limit to last 10 messages for context window)
  const recentHistory = chatHistory.slice(-10);
  let historyText = '';
  
  if (recentHistory.length > 0) {
    historyText = '\n## Recent Conversation:\n';
    for (const msg of recentHistory) {
      historyText += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    }
    historyText += '\n';
  }

  return `You are a Mermaid diagram assistant. Help the user modify their diagram based on their request.

## Current Diagram:
\`\`\`mermaid
${currentCode}
\`\`\`
${historyText}
## User Request:
${userMessage}

## Instructions:
1. Understand what change the user wants to make
2. Modify the diagram accordingly
3. Respond with a brief explanation followed by the updated code

Format your response EXACTLY like this:
EXPLANATION: [Brief description of what you changed]
CODE:
[The complete updated Mermaid code]

Keep explanations concise (1-2 sentences). Always provide the COMPLETE updated code, not just the changes.`;
}

/**
 * Parse the chat response to extract explanation and code
 */
export function parseChatResponse(response: string): { explanation: string; code: string } | null {
  try {
    // Try to find EXPLANATION: and CODE: markers
    const explanationMatch = response.match(/EXPLANATION:\s*(.+?)(?=\nCODE:|$)/is);
    const codeMatch = response.match(/CODE:\s*\n?([\s\S]+?)$/i);
    
    if (explanationMatch && codeMatch) {
      let code = codeMatch[1].trim();
      // Clean up code fences if present
      code = code.replace(/^```(?:mermaid)?\s*\n?/i, '');
      code = code.replace(/\n?```\s*$/i, '');
      
      return {
        explanation: explanationMatch[1].trim(),
        code: code.trim(),
      };
    }
    
    // Fallback: try to extract any code block
    const codeBlockMatch = response.match(/```(?:mermaid)?\s*\n?([\s\S]+?)\n?```/i);
    if (codeBlockMatch) {
      // Use everything before the code block as explanation
      const beforeCode = response.substring(0, response.indexOf('```')).trim();
      return {
        explanation: beforeCode || 'Here is the updated diagram:',
        code: codeBlockMatch[1].trim(),
      };
    }
    
    return null;
  } catch {
    return null;
  }
}
