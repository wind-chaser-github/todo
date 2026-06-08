import * as chrono from 'chrono-node';
import type { Priority, TodoState } from '../types';

export interface ParseResult {
  text: string;
  dueDate: number | null;
  priority: Priority;
  category?: 'work' | 'study' | 'health' | 'life' | 'other';
}

// Fallback local parser
export function parseLocalFallback(input: string): ParseResult {
  let text = input;
  let priority: Priority = 'none';
  let category: 'work' | 'study' | 'health' | 'life' | 'other' = 'other';

  const highPriorityRegex = /(高优先级|高优|紧急|high priority|urgent|!\!)/i;
  const mediumPriorityRegex = /(中优先级|中优|medium priority|!)/i;
  const lowPriorityRegex = /(低优先级|低优|low priority|不急)/i;

  if (highPriorityRegex.test(text)) {
    priority = 'high';
    text = text.replace(highPriorityRegex, '');
  } else if (mediumPriorityRegex.test(text)) {
    priority = 'medium';
    text = text.replace(mediumPriorityRegex, '');
  } else if (lowPriorityRegex.test(text)) {
    priority = 'low';
    text = text.replace(lowPriorityRegex, '');
  }

  const lowerInput = text.toLowerCase();
  if (lowerInput.includes('work') || lowerInput.includes('job')) category = 'work';
  else if (lowerInput.includes('study') || lowerInput.includes('read')) category = 'study';
  else if (lowerInput.includes('health') || lowerInput.includes('run')) category = 'health';
  else if (lowerInput.includes('life') || lowerInput.includes('buy')) category = 'life';

  const results = chrono.zh.parse(text);
  let dueDate: number | null = null;

  if (results && results.length > 0) {
    dueDate = results[0].start.date().getTime();
    text = text.replace(results[0].text, '');
  } else {
    const enResults = chrono.parse(text);
    if (enResults && enResults.length > 0) {
      dueDate = enResults[0].start.date().getTime();
      text = text.replace(enResults[0].text, '');
    }
  }

  text = text.replace(/[,，。!！?？\s]+/g, ' ').trim();
  return { text: text || input.trim(), dueDate, priority, category };
}

// LLM Parser
export async function parseWithLLM(
  input: string,
  llmConfig: TodoState['llmConfig']
): Promise<ParseResult> {
  if (!llmConfig.apiKey) {
    console.warn("No LLM API Key provided, using local parser fallback.");
    return parseLocalFallback(input);
  }

  const systemPrompt = `You are a productivity AI. Parse the user's input and extract task details.
Return ONLY a valid JSON object. No markdown formatting, no code blocks, no explanations.
The JSON must have the following structure:
{
  "text": "The core task name",
  "dueDate": null or a number representing Unix timestamp in milliseconds for when this is due,
  "priority": "high" | "medium" | "low" | "none",
  "category": "work" | "study" | "health" | "life" | "other"
}
Rules:
- Infer the date and time relative to NOW: ${new Date().toISOString()}
- If no specific time is mentioned but a day is, default to 12:00:00 (noon) of that day.
- For priority, infer from words like "urgent", "important", "asap" (high).
- For category, infer the context: exercise/diet -> health, reading/learning -> study, job/coding -> work, chores -> life.
- Return raw JSON only.`;

  try {
    const response = await fetch(`${llmConfig.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: input },
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    
    // Ensure format matches expected
    return {
      text: parsed.text || input,
      dueDate: parsed.dueDate || null,
      priority: parsed.priority || 'none',
    };
  } catch (error) {
    console.error("LLM parsing failed:", error);
    // Fallback to local parsing on failure
    return parseLocalFallback(input);
  }
}
