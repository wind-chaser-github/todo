export type Priority = 'high' | 'medium' | 'low' | 'none';
export type Category = 'work' | 'study' | 'health' | 'life' | 'other';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Position {
  x: number;
  y: number;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean; // For one-off tasks
  completedDates: string[]; // For recurring tasks
  priority: Priority;
  category: Category;
  recurrence?: { type: RecurrenceType, values?: number[] };
  dueDate?: number; // timestamp
  position: Position; // Physical position on the canvas (fallback)
  isHovered?: boolean;
  tags: string[];
  createdAt: number;
  streak: number;
  lastCompletedAt?: number;
  notified?: boolean; // System notification flag
}

export interface TodoState {
  todos: Todo[];
  focusModeId: string | null;
  focusLogs: Record<string, number>; // "YYYY-MM-DD" -> seconds
  llmConfig: {
    apiUrl: string;
    apiKey: string;
    model: string;
  };
  
  // Cloud Sync
  accessCode: string | null;
  isSyncing: boolean;
  setAccessCode: (code: string | null) => void;
  loadFromCloud: (code: string) => Promise<boolean>;

  // Global Actions
  setFocusMode: (id: string | null) => void;
  setLLMConfig: (config: Partial<TodoState['llmConfig']>) => void;
  addFocusTime: (seconds: number) => void;
  
  // Todo Actions
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'streak' | 'completedDates'>) => void;
  addTodoWithMetadata: (text: string, dueDate?: number, priority?: Priority, category?: Category, recurrence?: { type: RecurrenceType, values?: number[] }) => void;
  updateTodoPosition: (id: string, position: Position) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string, dateStr: string) => void;
  markNotified: (id: string) => void;
}
