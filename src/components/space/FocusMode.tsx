import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Check, ArrowLeft } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';

export function FocusMode() {
  const { focusModeId, setFocusMode, todos, toggleTodo } = useTodoStore();
  const todo = todos.find((t) => t.id === focusModeId);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create a subtle "black hole" gravitational warp effect
    const ctx = gsap.context(() => {
      gsap.to('.gravitational-ring', {
        rotation: 360,
        duration: 20,
        repeat: -1,
        ease: 'linear'
      });
      gsap.to('.gravitational-ring', {
        scale: 1.1,
        opacity: 0.8,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  if (!todo) {
    // Failsafe
    setTimeout(() => setFocusMode(null), 0);
    return null;
  }

  const handleComplete = () => {
    toggleTodo(todo.id);
    // Wait for the completion animation before exiting
    setTimeout(() => {
      setFocusMode(null);
    }, 600);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      {/* Black Hole Background Effects */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="gravitational-ring absolute w-[600px] h-[600px] rounded-full border-[1px] border-indigo-500/20 shadow-[0_0_100px_inset_rgba(99,102,241,0.2)]" />
        <div className="gravitational-ring absolute w-[400px] h-[400px] rounded-full border-[2px] border-purple-500/30 shadow-[0_0_80px_inset_rgba(168,85,247,0.3)]" style={{ animationDelay: '-5s' }} />
        <div className="absolute w-[200px] h-[200px] rounded-full bg-black shadow-[0_0_100px_rgba(0,0,0,1)] z-0" />
      </div>

      {/* Exit Button */}
      <button
        onClick={() => setFocusMode(null)}
        className="absolute top-8 left-8 flex items-center text-slate-500 hover:text-white transition-colors z-50 bg-white/5 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Escape Gravity
      </button>

      {/* Focused Content */}
      <div className="relative z-10 max-w-3xl w-full text-center">
        <motion.div
          initial={{ y: 50, scale: 0.8, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 20 }}
        >
          <span className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-xs mb-8 block drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]">
            Absolute Focus
          </span>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-16 leading-tight py-4">
            {todo.text}
          </h1>

          <div className="flex justify-center">
            <button
              onClick={handleComplete}
              className="group relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-indigo-600 rounded-full overflow-hidden hover:scale-105 transition-all shadow-[0_0_60px_-10px_rgba(99,102,241,0.8)] border border-indigo-400"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Check className="w-7 h-7 mr-3 drop-shadow-md" />
              Shatter It
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
