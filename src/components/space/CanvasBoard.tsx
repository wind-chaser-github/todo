import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Play, BarChart2, Home, Sparkles, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlignLeft, Flame } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { parseWithLLM } from '../../utils/nlp';
import { TodoCard } from './TodoCard';
import Particles from '../react-bits/Particles/Particles';
import BlurText from '../react-bits/BlurText/BlurText';
import type { Category, RecurrenceType } from '../../types';

type Tab = 'habits' | 'timer' | 'stats';

export function CanvasBoard() {
  const [activeTab, setActiveTab] = useState<Tab>('habits');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.getTime();
  });

  const isPastDate = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    return selectedDate < todayStart.getTime();
  }, [selectedDate]);

  // 全局提醒引擎
  const { todos, markNotified } = useTodoStore();
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    
    const interval = setInterval(() => {
      const now = Date.now();
      todos.forEach(t => {
        if (!t.completed && t.dueDate && !t.notified && !t.recurrence) {
          // 距离到期小于 5 分钟，且还在未来
          const diff = t.dueDate - now;
          if (diff > 0 && diff < 5 * 60 * 1000) {
            if (Notification.permission === "granted") {
              new Notification("Task Reminder 🔔", {
                body: `Your task "${t.text}" is starting in less than 5 minutes!`,
              });
            }
            markNotified(t.id);
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [todos, markNotified]);

  return (
    <div className="w-full h-screen bg-[#FAF9F6] font-sans overflow-hidden text-slate-800 relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <Particles
          particleColors={['#fbcfe8', '#a7f3d0', '#fef08a']}
          particleCount={50}
          particleSpread={20}
          speed={0.03}
          particleBaseSize={100}
          alphaParticles={true}
        />
      </div>

      <div className="hidden lg:flex w-full h-full relative z-10 max-w-[1600px] mx-auto p-6 gap-6">
        <div className="w-[550px] shrink-0 flex flex-col bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden border border-white">
          <CalendarStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
          <div className="flex-1 overflow-y-auto custom-scrollbar-light relative">
            <HabitsView date={selectedDate} />
          </div>
          {!isPastDate && (
            <div className="p-6 bg-gradient-to-t from-white via-white to-transparent pt-12 flex justify-center">
               <button 
                  onClick={() => setShowAddModal(true)}
                  className="w-16 h-16 rounded-3xl bg-emerald-400 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(52,211,153,0.3)] hover:scale-105 transition-transform"
                >
                  <Plus className="w-8 h-8" />
                </button>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex-1 bg-blue-50/50 backdrop-blur-2xl rounded-[3rem] shadow-sm border border-white overflow-hidden relative">
            <TimerView />
          </div>
          <div className="h-[350px] bg-slate-50/50 backdrop-blur-2xl rounded-[3rem] shadow-sm border border-white overflow-hidden p-8">
            <StatsView />
          </div>
        </div>
      </div>

      <div className="flex lg:hidden w-full h-full flex-col relative z-10 bg-white">
        <div className="flex-1 overflow-y-auto custom-scrollbar-light relative">
          <AnimatePresence mode="wait">
            {activeTab === 'habits' && (
              <motion.div key="habits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full flex flex-col">
                <CalendarStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
                <HabitsView date={selectedDate} />
              </motion.div>
            )}
            {activeTab === 'timer' && <TimerView key="timer" />}
            {activeTab === 'stats' && <StatsView key="stats" />}
          </AnimatePresence>
        </div>

        <div className="h-24 pb-6 px-8 flex items-center justify-between bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <DockButton active={activeTab === 'habits'} icon={<Home className="w-6 h-6" />} label="Habits" onClick={() => setActiveTab('habits')} color="text-emerald-400" />
          <button 
            onClick={() => {
              if (isPastDate) return alert("过去的时光已成定局，只能回味，不能再增加任务啦！");
              setShowAddModal(true);
            }}
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-transform -mt-6 ${isPastDate ? 'bg-slate-300 cursor-not-allowed opacity-50' : 'bg-slate-900 active:scale-95'}`}
          >
            <Plus className="w-7 h-7" />
          </button>
          <DockButton active={activeTab === 'timer'} icon={<Play className="w-6 h-6" />} label="Focus" onClick={() => setActiveTab('timer')} color="text-amber-400" />
          <DockButton active={activeTab === 'stats'} icon={<BarChart2 className="w-6 h-6" />} label="Stats" onClick={() => setActiveTab('stats')} color="text-blue-400" />
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && <AddModal onClose={() => setShowAddModal(false)} date={selectedDate} setDate={setSelectedDate} />}
      </AnimatePresence>
    </div>
  );
}

function CalendarStrip({ selectedDate, onSelect }: { selectedDate: number, onSelect: (ts: number) => void }) {
  const days = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [selectedDate]);

  const changeDate = (daysToAdd: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + daysToAdd);
    onSelect(d.getTime());
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  return (
    <div className="px-6 pt-10 pb-4 bg-white/50 backdrop-blur-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-400" />
          {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => changeDate(-1)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={() => changeDate(1)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>
      
      <div className="flex justify-between items-center gap-2">
        {days.map(d => {
          const isSelected = d.getTime() === selectedDate;
          return (
            <button 
              key={d.getTime()}
              onClick={() => onSelect(d.getTime())}
              className={`flex-1 flex flex-col items-center py-3 rounded-2xl transition-all ${isSelected ? 'bg-indigo-500 text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)] scale-105' : 'bg-transparent text-slate-400 hover:bg-slate-100'}`}
            >
              <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className={`text-lg font-black ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                {d.getDate()}
              </span>
              {isToday(d) && <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-400'}`} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HabitsView({ date }: { date: number }) {
  const { todos } = useTodoStore();
  const [filter, setFilter] = useState<Category | 'all'>('all');
  
  const targetDateStr = new Date(date).toISOString().split('T')[0];

  const dayTodos = useMemo(() => {
    const endOfDay = date + 24 * 60 * 60 * 1000;
    const targetDateObj = new Date(date);
    
    return todos.filter(t => {
      // 分类过滤
      if (filter !== 'all' && t.category !== filter) return false;
      
      // 循环任务投影
      if (t.recurrence) {
        if (t.createdAt > endOfDay) return false; // 还没被创建
        if (t.recurrence.type === 'daily') return true;
        if (t.recurrence.type === 'weekly' && t.recurrence.values?.includes(targetDateObj.getDay())) return true;
        if (t.recurrence.type === 'monthly' && t.recurrence.values?.includes(targetDateObj.getDate())) return true;
        return false;
      }
      
      // 单次任务
      if (!t.dueDate) return true;
      return t.dueDate >= date && t.dueDate < endOfDay;
    });
  }, [todos, date, filter]);

  // 时间线分组
  const groups = useMemo(() => {
    const anytime: any[] = [];
    const timed: Record<string, any[]> = {};
    
    dayTodos.forEach(t => {
      if (!t.dueDate) {
        anytime.push(t);
      } else {
        const d = new Date(t.dueDate);
        // 如果是 12:00:00 (我们设定的默认没时间的时间)，或者循环任务，算作 Anytime
        if ((d.getHours() === 12 && d.getMinutes() === 0) || t.recurrence) {
          anytime.push(t);
        } else {
          const hour = `${d.getHours().toString().padStart(2, '0')}:00`;
          if (!timed[hour]) timed[hour] = [];
          timed[hour].push(t);
        }
      }
    });

    const sortedHours = Object.keys(timed).sort();
    return { anytime, timed, sortedHours };
  }, [dayTodos]);

  const isCompleted = (t: any) => {
    if (t.recurrence) {
      return t.completedDates?.includes(targetDateStr);
    }
    return t.completed;
  };

  const completedCount = dayTodos.filter(t => isCompleted(t)).length;
  const progress = dayTodos.length > 0 ? (completedCount / dayTodos.length) * 100 : 0;

  return (
    <div className="p-6 pt-4 pb-24 min-h-full">
      {/* 顶部分类胶囊 */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar-light pb-4 mb-4">
        {['all', 'work', 'study', 'health', 'life'].map(c => (
          <button 
            key={c} onClick={() => setFilter(c as any)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${filter === c ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-8 bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight leading-tight">Daily<br/>Timeline</h1>
        </div>
        <div className="relative w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-sm">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="text-emerald-400 transition-all duration-1000 ease-out" strokeWidth="4" strokeDasharray={`${progress}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span className="absolute text-xs font-bold text-slate-700">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="relative">
        {/* 时间线骨架 */}
        <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-slate-100 rounded-full" />
        
        {dayTodos.length === 0 ? (
          <div className="text-center py-20 relative z-10 bg-white/50 backdrop-blur-md rounded-3xl">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">🌻</div>
            <p className="text-slate-400 font-medium">没安排？好好享受这宁静的一天吧。</p>
          </div>
        ) : (
          <AnimatePresence>
            {/* Anytime Block */}
            {groups.anytime.length > 0 && (
              <div className="mb-8 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-[80px] text-right text-xs font-black text-slate-400 uppercase tracking-widest">Anytime</div>
                  <div className="w-3 h-3 bg-white border-[3px] border-indigo-400 rounded-full shrink-0 relative -left-[6px] shadow-sm" />
                </div>
                <div className="pl-[100px] space-y-4">
                  {groups.anytime.map(todo => <TodoCard key={todo.id} todo={todo} dateStr={targetDateStr} isCompleted={isCompleted(todo)} />)}
                </div>
              </div>
            )}
            
            {/* Timed Blocks */}
            {groups.sortedHours.map(hour => (
              <div key={hour} className="mb-8 relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-[80px] text-right text-sm font-black text-slate-700 tabular-nums">{hour}</div>
                  <div className="w-3 h-3 bg-white border-[3px] border-emerald-400 rounded-full shrink-0 relative -left-[6px] shadow-sm" />
                </div>
                <div className="pl-[100px] space-y-4">
                  {groups.timed[hour].map(todo => <TodoCard key={todo.id} todo={todo} dateStr={targetDateStr} isCompleted={isCompleted(todo)} />)}
                </div>
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function TimerView() {
  const { todos, addFocusTime } = useTodoStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('');

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      addFocusTime(25 * 60);
      if (Notification.permission === "granted") {
        new Notification("Focus Session Complete! 🍅", { body: "Take a 5 minute break." });
      }
      setTimeLeft(25 * 60);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft, addFocusTime]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 pt-12 min-h-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2"><BlurText text="Focus Mode" delay={50} /></h2>
        <select 
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value)}
          disabled={isRunning}
          className="mt-4 appearance-none bg-white/50 backdrop-blur-md border border-blue-100 text-slate-700 py-2 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm transition-all text-sm font-medium"
        >
          <option value="">-- 自主专注 --</option>
          {todos.filter(t => !t.completed).map(t => (
            <option key={t.id} value={t.id}>{t.text}</option>
          ))}
        </select>
      </div>

      <div className="relative w-72 h-72 flex items-center justify-center mb-16">
        <div className={`absolute inset-0 bg-blue-300/30 rounded-full blur-3xl transition-all duration-1000 ${isRunning ? 'scale-110 opacity-100' : 'scale-90 opacity-50'}`} />
        <div className="absolute inset-0 border-[16px] border-white/60 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.05)]" />
        <div className="relative flex flex-col items-center">
          <span className="text-7xl font-black text-slate-800 tracking-tighter tabular-nums drop-shadow-sm">{mins}:{secs}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isRunning ? 'bg-rose-100 text-rose-500 hover:bg-rose-200' : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105'} active:scale-95`}
        >
          {isRunning ? <div className="w-6 h-6 bg-rose-500 rounded-sm" /> : <Play className="w-8 h-8 ml-1" />}
        </button>
      </div>
    </motion.div>
  );
}

function StatsView() {
  const { focusLogs } = useTodoStore();
  const stats = useMemo(() => {
    const data = [];
    const labels = [];
    let totalSeconds = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const secs = focusLogs[iso] || 0;
      data.push(secs);
      labels.push('SMTWTFS'[d.getDay()]);
      totalSeconds += secs;
    }
    const max = Math.max(...data, 25 * 60);
    const heights = data.map(s => (s / max) * 100);
    return { heights, labels, totalHours: Math.floor(totalSeconds / 3600), totalMins: Math.floor((totalSeconds % 3600) / 60) };
  }, [focusLogs]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">Weekly Focus</h1>
          <p className="text-slate-400 font-medium">{stats.totalHours}h {stats.totalMins}m total time</p>
        </div>
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl shadow-inner"><Flame className="w-6 h-6 text-orange-500" /></div>
      </div>
      <div className="flex items-end justify-between flex-1 gap-3 pt-4 border-t border-slate-100/50">
        {stats.heights.map((h, i) => (
          <div key={i} className="w-full flex flex-col items-center gap-3">
            <div className="w-full bg-slate-100/50 rounded-full relative overflow-hidden h-full">
              <div className="absolute bottom-0 w-full bg-emerald-400 rounded-full transition-all duration-1000 ease-out" style={{ height: `${h}%` }} />
            </div>
            <span className="text-[11px] font-bold text-slate-400">{stats.labels[i]}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function AddModal({ onClose, date, setDate }: { onClose: () => void, date: number, setDate: (d: number) => void }) {
  const { addTodoWithMetadata, llmConfig } = useTodoStore();
  const [mode, setMode] = useState<'ai' | 'manual'>('manual');
  
  const [val, setVal] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  const [manualTitle, setManualTitle] = useState('');
  const [manualDate, setManualDate] = useState(() => new Date(date).toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('09:00');
  const [category, setCategory] = useState<Category>('work');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  const todayISO = new Date().toISOString().split('T')[0];

  const onAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    if (date < todayStart.getTime()) setDate(todayStart.getTime());
    setIsParsing(true);
    try {
      const res = await parseWithLLM(val, llmConfig);
      let targetDate = res.dueDate ? res.dueDate : date + 12 * 60 * 60 * 1000;
      if (targetDate < todayStart.getTime()) targetDate = todayStart.getTime() + 12 * 60 * 60 * 1000;
      addTodoWithMetadata(res.text, targetDate, res.priority, res.category);
      onClose();
    } catch(err) { setIsParsing(false); }
  };

  const onManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    const targetDateObj = new Date(`${manualDate}T${manualTime}:00`);
    if (recurrence === 'none' && targetDateObj.getTime() < new Date().setHours(0,0,0,0)) return alert("不能添加过去的单次任务！");
    
    addTodoWithMetadata(
      manualTitle, 
      targetDateObj.getTime(), 
      'medium', 
      category, 
      recurrence === 'none' ? undefined : { type: recurrence }
    );
    setDate(targetDateObj.getTime());
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="absolute inset-0 z-[100] bg-black/20 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 pb-0 bg-emerald-50 relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/50 rounded-full text-slate-400 hover:text-slate-800"><X className="w-5 h-5" /></button>
          <div className="flex gap-4 border-b border-emerald-200/50 pb-2 mt-4">
            <button onClick={() => setMode('ai')} className={`flex items-center gap-2 pb-2 px-2 text-lg font-black transition-all border-b-2 ${mode === 'ai' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>
              <Sparkles className="w-5 h-5" /> AI 魔法
            </button>
            <button onClick={() => setMode('manual')} className={`flex items-center gap-2 pb-2 px-2 text-lg font-black transition-all border-b-2 ${mode === 'manual' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>
              <AlignLeft className="w-5 h-5" /> 表单
            </button>
          </div>
        </div>

        {mode === 'ai' ? (
          <form onSubmit={onAiSubmit} className="p-8 flex-1 bg-emerald-50 flex flex-col">
            <textarea autoFocus value={val} onChange={e => setVal(e.target.value)} placeholder="例如：以后每周三晚上打篮球" className="w-full h-48 flex-1 bg-white rounded-3xl p-6 text-lg text-slate-700 placeholder-slate-300 focus:outline-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] resize-none" />
            <button disabled={isParsing || !val.trim()} className="mt-6 w-full py-5 bg-emerald-400 text-white font-bold text-lg rounded-[2rem] shadow-[0_8px_20px_rgba(52,211,153,0.3)] disabled:opacity-50 hover:bg-emerald-500 transition-colors">
              {isParsing ? <Sparkles className="w-6 h-6 animate-spin mx-auto" /> : 'AI 魔法解析 🪄'}
            </button>
          </form>
        ) : (
          <form onSubmit={onManualSubmit} className="p-8 flex-1 bg-emerald-50 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">名称</label>
              <input type="text" autoFocus required value={manualTitle} onChange={e => setManualTitle(e.target.value)} placeholder="背单词" className="w-full bg-white rounded-2xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-emerald-300 focus:outline-none" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-1">开始日期</label>
                <input type="date" required value={manualDate} min={todayISO} onChange={e => setManualDate(e.target.value)} className="w-full bg-white rounded-2xl px-4 py-3 text-slate-700 focus:outline-none" />
              </div>
              <div className="w-1/3">
                <label className="block text-xs font-bold text-slate-400 mb-1">时间</label>
                <input type="time" value={manualTime} onChange={e => setManualTime(e.target.value)} className="w-full bg-white rounded-2xl px-4 py-3 text-slate-700 focus:outline-none" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-1">循环规律</label>
                <select value={recurrence} onChange={e => setRecurrence(e.target.value as any)} className="w-full bg-white rounded-2xl px-4 py-3 text-slate-700 focus:outline-none">
                  <option value="none">单次任务</option>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="monthly">每月</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-1">分类</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full bg-white rounded-2xl px-4 py-3 text-slate-700 focus:outline-none">
                  <option value="work">💼 工作</option>
                  <option value="study">📚 学习</option>
                  <option value="health">🏃 健康</option>
                  <option value="life">🌿 生活</option>
                </select>
              </div>
            </div>

            <button disabled={!manualTitle.trim()} className="mt-4 w-full py-4 bg-slate-800 text-white font-bold text-lg rounded-[2rem] shadow-[0_8px_20px_rgba(0,0,0,0.15)] disabled:opacity-50 hover:bg-slate-900 transition-colors">
              确定添加
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

function DockButton({ active, icon, onClick, color }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? color : 'text-slate-300 hover:text-slate-400'}`}>
      <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-slate-50 scale-110 shadow-sm' : ''}`}>{icon}</div>
    </button>
  );
}
