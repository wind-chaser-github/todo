import React from 'react';
import { motion } from 'framer-motion';
import { Check, Briefcase, BookOpen, HeartPulse, Coffee, CircleEllipsis } from 'lucide-react';
import type { Todo, Category } from '../../types';
import { useTodoStore } from '../../store/useTodoStore';
import { cn } from '../../utils/cn';
import SpotlightCard from '../react-bits/SpotlightCard/SpotlightCard';

interface TodoCardProps {
  todo: Todo;
  dateStr: string;
  isCompleted: boolean;
}

// 基于真实分类设定马卡龙颜色与 Icon
function getCategoryStyle(cat?: Category) {
  switch (cat) {
    case 'work':
      return { icon: <Briefcase size={24} />, bg: 'bg-blue-100 text-blue-600', spotlight: 'rgba(96, 165, 250, 0.25)' };
    case 'study':
      return { icon: <BookOpen size={24} />, bg: 'bg-amber-100 text-amber-600', spotlight: 'rgba(251, 191, 36, 0.25)' };
    case 'health':
      return { icon: <HeartPulse size={24} />, bg: 'bg-emerald-100 text-emerald-600', spotlight: 'rgba(52, 211, 153, 0.25)' };
    case 'life':
      return { icon: <Coffee size={24} />, bg: 'bg-rose-100 text-rose-600', spotlight: 'rgba(244, 63, 94, 0.25)' };
    default:
      return { icon: <CircleEllipsis size={24} />, bg: 'bg-slate-100 text-slate-600', spotlight: 'rgba(148, 163, 184, 0.25)' };
  }
}

export function TodoCard({ todo, dateStr, isCompleted }: TodoCardProps) {
  const { toggleTodo } = useTodoStore();
  const style = getCategoryStyle(todo.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isCompleted ? 0.6 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full relative"
    >
      <SpotlightCard 
        spotlightColor={style.spotlight}
        className={cn(
          "w-full p-4 rounded-3xl flex items-center gap-4 transition-all shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]",
          isCompleted ? "bg-slate-50 grayscale border border-slate-100" : "bg-white border border-transparent",
        )}
      >
        {/* 左侧分类 Icon 块 */}
        <div className={cn("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-sm transition-colors", style.bg)}>
          {style.icon}
        </div>
        
        {/* 中间文字和连击 */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[15px] font-bold text-slate-700 leading-snug truncate",
            isCompleted && "line-through text-slate-400"
          )}>
            {todo.text}
          </p>
          
          <div className="mt-1.5 flex items-center gap-2 overflow-hidden">
            {todo.streak > 0 && (
              <span className="shrink-0 text-[10px] font-bold text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100/50">
                🔥 {todo.streak} Days
              </span>
            )}
            {todo.recurrence && (
              <span className="shrink-0 text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100/50 uppercase">
                ↻ {todo.recurrence.type}
              </span>
            )}
            {todo.dueDate && (
               <span className="shrink-0 text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">
                 {new Date(todo.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
            )}
            {/* Display future/overdue labels subtly */}
            {todo.dueDate && todo.dueDate < Date.now() && !isCompleted && !todo.recurrence && (
               <span className="shrink-0 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100/50">
                 Overdue
               </span>
            )}
          </div>
        </div>

        {/* 右侧巨大打卡圈 */}
        <button
          onClick={() => toggleTodo(todo.id, dateStr)}
          className={cn(
            "shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10",
            isCompleted 
              ? "bg-emerald-400 border-emerald-400 text-white shadow-[0_0_15px_rgba(52,211,153,0.4)]" 
              : "border-slate-200 text-transparent hover:border-emerald-300 hover:bg-emerald-50"
          )}
        >
          <Check className="w-5 h-5" strokeWidth={3} />
        </button>
      </SpotlightCard>
    </motion.div>
  );
}
