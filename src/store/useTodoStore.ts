import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TodoState, Todo, Position } from '../types';

let debounceTimer: NodeJS.Timeout;

export const useTodoStore = create<TodoState>()(
  (set, get) => ({
    todos: [],
    focusModeId: null,
    focusLogs: {}, // "YYYY-MM-DD" -> seconds
    llmConfig: {
      apiUrl: 'http://localhost:11434/api/generate',
      apiKey: '',
      model: 'llama3.2',
    },

    // Cloud
    accessCode: null,
    isSyncing: false,
    
    setAccessCode: (code) => set({ accessCode: code }),
    
    loadFromCloud: async (code) => {
      set({ isSyncing: true });
      try {
        const res = await fetch(`/api/sync?code=${code}`);
        if (res.ok) {
          const data = await res.json();
          // 只有服务器返回了有效数据对象，我们才注入
          if (data && typeof data === 'object' && !data.error) {
            set({
              todos: data.todos || [],
              focusLogs: data.focusLogs || {},
              llmConfig: data.llmConfig || get().llmConfig,
              accessCode: code,
              isSyncing: false
            });
            return true;
          }
        }
      } catch (e) {
        console.error(e);
      }
      set({ isSyncing: false });
      return false;
    },

    setFocusMode: (id) => set({ focusModeId: id }),
    setLLMConfig: (config) => set((state) => ({ llmConfig: { ...state.llmConfig, ...config } })),
    
    addFocusTime: (seconds) => set((state) => {
      const today = new Date().toISOString().split('T')[0];
      const newLogs = { ...state.focusLogs };
      newLogs[today] = (newLogs[today] || 0) + seconds;
      return { focusLogs: newLogs };
    }),

    addTodo: (todo) => set((state) => ({
      todos: [...state.todos, {
        ...todo,
        id: uuidv4(),
        createdAt: Date.now(),
        streak: 0,
        completedDates: [],
      }],
    })),
    
    addTodoWithMetadata: (text, dueDate, priority, category, recurrence) => set((state) => {
      let targetDate = dueDate;
      if (targetDate && (!recurrence || recurrence.type === 'none')) {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        if (targetDate < todayStart.getTime()) {
          console.warn("Attempted to add a past date, snapping to today.");
          const d = new Date();
          d.setHours(12,0,0,0);
          targetDate = d.getTime();
        }
      }
      
      return {
        todos: [...state.todos, {
          id: uuidv4(),
          text,
          completed: false,
          completedDates: [],
          priority: priority || 'medium',
          category: category || 'other',
          recurrence: recurrence?.type === 'none' ? undefined : recurrence,
          dueDate: targetDate,
          position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
          tags: [],
          createdAt: Date.now(),
          streak: 0,
        }],
      };
    }),

    updateTodoPosition: (id, position) => set((state) => ({
      todos: state.todos.map(t => t.id === id ? { ...t, position } : t)
    })),

    deleteTodo: (id) => set((state) => ({
      todos: state.todos.filter(t => t.id !== id),
      focusModeId: state.focusModeId === id ? null : state.focusModeId,
    })),

    markNotified: (id) => set((state) => ({
      todos: state.todos.map(t => t.id === id ? { ...t, notified: true } : t)
    })),

    toggleTodo: (id, dateStr) => set((state) => ({
      todos: state.todos.map(t => {
        if (t.id === id) {
          let isCompleting = false;
          let newCompletedDates = [...t.completedDates];

          if (t.recurrence) {
            if (newCompletedDates.includes(dateStr)) {
              newCompletedDates = newCompletedDates.filter(d => d !== dateStr);
              isCompleting = false;
            } else {
              newCompletedDates.push(dateStr);
              isCompleting = true;
            }
          } else {
            isCompleting = !t.completed;
          }

          let newStreak = t.streak || 0;
          const now = Date.now();
          
          if (isCompleting) {
             if (!t.lastCompletedAt) {
               newStreak = 1;
             } else {
               const lastDate = new Date(t.lastCompletedAt);
               const today = new Date();
               const diffDays = Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
               
               if (diffDays <= 1.5) {
                 newStreak += 1;
               } else {
                 newStreak = 1;
               }
             }
          }
          
          return { 
            ...t, 
            completed: t.recurrence ? false : isCompleting, 
            completedDates: newCompletedDates,
            streak: newStreak,
            lastCompletedAt: isCompleting ? now : t.lastCompletedAt
          };
        }
        return t;
      })
    })),
  })
);

// Subscribe to store changes and sync to cloud debounced
useTodoStore.subscribe((state, prevState) => {
  if (!state.accessCode) return;
  // Ignore purely local state changes like isSyncing or focusModeId
  if (
    state.todos !== prevState.todos || 
    state.focusLogs !== prevState.focusLogs || 
    state.llmConfig !== prevState.llmConfig
  ) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      useTodoStore.setState({ isSyncing: true });
      try {
        await fetch(`/api/sync?code=${state.accessCode}`, {
          method: 'POST',
          body: JSON.stringify({
            todos: state.todos,
            focusLogs: state.focusLogs,
            llmConfig: state.llmConfig
          })
        });
      } catch (e) {
        console.error("Cloud Sync failed", e);
      }
      useTodoStore.setState({ isSyncing: false });
    }, 2000); // Sync after 2 seconds of inactivity
  }
});
