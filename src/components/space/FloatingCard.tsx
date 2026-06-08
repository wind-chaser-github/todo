import React, { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Target, Check, Calendar } from 'lucide-react';
import type { Todo } from '../../types';
import { useTodoStore } from '../../store/useTodoStore';
import { cn } from '../../utils/cn';
import SpotlightCard from '../react-bits/SpotlightCard/SpotlightCard';

interface FloatingCardProps {
  todo: Todo;
}

const priorityGlow: Record<string, string> = {
  high: 'rgba(244, 63, 94, 0.4)', // Rose
  medium: 'rgba(251, 191, 36, 0.3)', // Amber
  low: 'rgba(96, 165, 250, 0.2)', // Blue
  none: 'rgba(255, 255, 255, 0.15)',
};

export function FloatingCard({ todo }: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { updateTodoPosition, toggleTodo, setFocusMode } = useTodoStore();

  const { zIndex, scale, blur } = useMemo(() => {
    if (todo.completed) return { zIndex: -2000, scale: 0.5, blur: 'blur(4px)' };
    if (!todo.dueDate) return { zIndex: -800, scale: 0.8, blur: 'blur(2px)' };
    
    const now = Date.now();
    const diffHours = (todo.dueDate - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return { zIndex: 200, scale: 1.2, blur: 'blur(0px)' };
    if (diffHours < 24) return { zIndex: 0, scale: 1, blur: 'blur(0px)' };
    if (diffHours < 24 * 7) return { zIndex: -400, scale: 0.9, blur: 'blur(1px)' };
    
    return { zIndex: -1000, scale: 0.7, blur: 'blur(3px)' };
  }, [todo.dueDate, todo.completed]);

  return (
    <motion.div
      ref={cardRef}
      layout
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        updateTodoPosition(todo.id, {
          x: todo.position.x + info.offset.x,
          y: todo.position.y + info.offset.y,
        });
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: todo.completed ? 0.3 : 1, 
        scale: scale,
        translateZ: zIndex,
        filter: blur
      }}
      exit={{ opacity: 0, scale: 0, filter: 'blur(10px)' }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      style={{
        position: 'absolute',
        left: todo.position?.x ?? window.innerWidth / 2,
        top: todo.position?.y ?? window.innerHeight / 2,
        transform: `translate(-50%, -50%) translateZ(${zIndex}px)`,
        transformStyle: 'preserve-3d',
      }}
      className="z-10 hover:z-50 cursor-grab active:cursor-grabbing w-64"
    >
      <SpotlightCard 
        spotlightColor={priorityGlow[todo.priority]}
        className={cn(
          "group flex flex-col p-6 rounded-3xl min-h-[160px]",
          "bg-white/5 backdrop-blur-2xl transition-all border border-white/10",
          todo.completed && "grayscale opacity-50"
        )}
      >
        <p className={cn(
          "text-lg font-medium text-slate-100 z-10 break-words leading-snug",
          todo.completed && "line-through text-slate-400"
        )}>
          {todo.text}
        </p>

        {todo.dueDate && (
          <div className="mt-4 flex items-center text-xs font-medium text-indigo-300 z-10 bg-indigo-500/20 px-2 py-1 rounded-md w-fit">
            <Calendar className="w-3 h-3 mr-1" />
            {new Date(todo.dueDate).toLocaleDateString()}
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-md transition-all flex items-center justify-center gap-4 z-20">
          <button
            onPointerDown={(e) => e.stopPropagation()} 
            onClick={() => toggleTodo(todo.id)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all border border-blue-500/50 hover:scale-110"
          >
            <Check className="w-6 h-6" />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setFocusMode(todo.id)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white transition-all border border-purple-500/50 hover:scale-110"
          >
            <Target className="w-6 h-6" />
          </button>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
