import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Play, BarChart2, Home, Sparkles, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlignLeft, Flame, LogOut, CloudRain, Coffee, Wind } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';
import { parseWithLLM } from '../../utils/nlp';
import { TodoCard } from './TodoCard';
import Particles from '../react-bits/Particles/Particles';
import TrueFocus from '../react-bits/TrueFocus/TrueFocus';
import Magnet from '../react-bits/Magnet/Magnet';
import type { Category, RecurrenceType } from '../../types';

type Tab = 'habits' | 'timer' | 'stats';

export function CanvasBoard() {
  const [activeTab, setActiveTab] = useState<Tab>('habits');
  const [activeRightTab, setActiveRightTab] = useState<'timer' | 'stats'>('timer');
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

      <button 
        onClick={() => useTodoStore.setState({ accessCode: null })}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/50 backdrop-blur-md border border-white/40 text-slate-400 hover:text-slate-700 hover:bg-white shadow-sm transition-all"
        title="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>

      <div className="hidden lg:flex w-full h-full relative z-10 max-w-[1600px] mx-auto p-6 gap-6 pt-20">
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

        <div className="flex-1 bg-white/60 backdrop-blur-3xl rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden border border-white flex flex-col p-6">
          <div className="flex justify-center mb-8 shrink-0">
             <div className="bg-white/80 p-1.5 rounded-full flex gap-2 shadow-sm border border-blue-50/50">
               <button onClick={() => setActiveRightTab('timer')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeRightTab==='timer' ? 'bg-blue-500 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>Focus Mode</button>
               <button onClick={() => setActiveRightTab('stats')} className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${activeRightTab==='stats' ? 'bg-blue-500 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}>Weekly Focus</button>
             </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
             <AnimatePresence mode="wait">
               {activeRightTab === 'timer' && (
                 <motion.div key="timer" initial={{opacity:0, scale:0.98}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.98}} className="absolute inset-0">
                   <TimerView />
                 </motion.div>
               )}
               {activeRightTab === 'stats' && (
                 <motion.div key="stats" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="absolute inset-0">
                   <StatsView />
                 </motion.div>
               )}
             </AnimatePresence>
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

        <button 
          onClick={() => useTodoStore.setState({ accessCode: null })}
          className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/80 backdrop-blur-md border border-white text-slate-400 shadow-sm"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="h-24 pb-6 px-8 flex items-center justify-between bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <DockButton active={activeTab === 'habits'} icon={<Home className="w-6 h-6" />} label="Timeline" onClick={() => setActiveTab('habits')} color="text-emerald-400" />
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
          <DockButton active={activeTab === 'stats'} icon={<BarChart2 className="w-6 h-6" />} label="Weekly" onClick={() => setActiveTab('stats')} color="text-blue-400" />
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
  const { addFocusTime } = useTodoStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambient, setAmbient] = useState<'none' | 'rain' | 'cafe' | 'space'>('none');
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    if (ambient !== 'none') {
       const urls = {
          rain: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=heavy-rain-nature-sounds-8186.mp3',
          cafe: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=cafe-background-noise-10023.mp3',
          space: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2db509041d.mp3?filename=white-noise-10min-109783.mp3'
       };
       if (!audioRef.current) {
          audioRef.current = new Audio(urls[ambient]);
          audioRef.current.loop = true;
       } else {
          audioRef.current.src = urls[ambient];
       }
       if (isRunning) audioRef.current.play().catch(console.error);
    } else {
       if (audioRef.current) {
         audioRef.current.pause();
       }
    }
  }, [ambient]);

  useEffect(() => {
    if (audioRef.current) {
      if (isRunning && ambient !== 'none') audioRef.current.play().catch(console.error);
      else audioRef.current.pause();
    }
  }, [isRunning, ambient]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  return (
    <div className="h-full w-full flex flex-col items-center justify-center relative">
      <div className="absolute top-4 right-4 flex gap-2 z-30">
        <button onClick={() => setAmbient(ambient === 'rain' ? 'none' : 'rain')} className={`p-2.5 rounded-full backdrop-blur-md transition-all border ${ambient === 'rain' ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-110' : 'bg-white/50 border-white text-slate-400 hover:text-slate-600 hover:bg-white'}`} title="Rain"><CloudRain className="w-5 h-5" /></button>
        <button onClick={() => setAmbient(ambient === 'cafe' ? 'none' : 'cafe')} className={`p-2.5 rounded-full backdrop-blur-md transition-all border ${ambient === 'cafe' ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110' : 'bg-white/50 border-white text-slate-400 hover:text-slate-600 hover:bg-white'}`} title="Cafe"><Coffee className="w-5 h-5" /></button>
        <button onClick={() => setAmbient(ambient === 'space' ? 'none' : 'space')} className={`p-2.5 rounded-full backdrop-blur-md transition-all border ${ambient === 'space' ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110' : 'bg-white/50 border-white text-slate-400 hover:text-slate-600 hover:bg-white'}`} title="Space"><Wind className="w-5 h-5" /></button>
      </div>

      <div className="absolute top-10 lg:top-16 left-1/2 -translate-x-1/2 text-center z-20">
         <TrueFocus 
            sentence={isRunning ? "FOCUSING" : "AWAITING"}
            manualMode={false}
            blurAmount={4}
            borderColor="#60a5fa"
            animationDuration={1}
            pauseBetweenAnimations={1}
          />
      </div>

      <div className="relative w-64 h-64 lg:w-96 lg:h-96 flex items-center justify-center mb-16">
        <div className={`absolute inset-0 bg-blue-400/20 rounded-full blur-[60px] transition-all duration-1000 ${isRunning ? 'scale-110 opacity-100' : 'scale-90 opacity-50'}`} />
        <div className={`absolute inset-0 border-[12px] lg:border-[20px] rounded-full transition-all duration-[2000ms] ease-out ${isRunning ? 'border-blue-400 shadow-[0_0_80px_rgba(96,165,250,0.3)] scale-100' : 'border-slate-200 scale-95'}`} />
        
        <div className="relative flex flex-col items-center">
          <span className="text-7xl lg:text-8xl font-black text-slate-800 tracking-tighter tabular-nums drop-shadow-sm">
             {mins}:{secs}
          </span>
        </div>
      </div>

      <div className="absolute bottom-[10%] lg:bottom-[20%] left-1/2 -translate-x-1/2 z-20">
         <Magnet padding={100} disabled={false} magnetStrength={3}>
           <button 
              onClick={() => setIsRunning(!isRunning)}
              className={`w-20 h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 ${isRunning ? 'bg-slate-50 text-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.3)] border border-rose-100' : 'bg-blue-500 text-white shadow-[0_10px_50px_rgba(59,130,246,0.4)]'}`}
            >
              {isRunning ? <div className="w-6 h-6 lg:w-8 lg:h-8 bg-rose-500 rounded-sm" /> : <Play className="w-8 h-8 lg:w-10 lg:h-10 ml-2" fill="currentColor" />}
            </button>
         </Magnet>
      </div>
    </div>
  );
}

function StatsView() {
  const { focusLogs } = useTodoStore();
  const stats = useMemo(() => {
    const WEEKS = 12;
    const DAYS = 7;
    const grid = [];
    let totalSeconds = 0;
    
    // Generate dates from today backwards
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from Sunday of the week that is WEEKS-1 ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

    for (let w = 0; w < WEEKS; w++) {
      const col = [];
      for (let d = 0; d < DAYS; d++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + (w * 7) + d);
        
        const iso = current.toISOString().split('T')[0];
        const secs = focusLogs[iso] || 0;
        
        // Skip future dates visually
        if (current > today) {
          col.push({ date: iso, secs: -1 });
        } else {
          col.push({ date: iso, secs });
          totalSeconds += secs;
        }
      }
      grid.push(col);
    }

    return { grid, totalHours: Math.floor(totalSeconds / 3600), totalMins: Math.floor((totalSeconds % 3600) / 60) };
  }, [focusLogs]);

  const getIntensityClass = (secs: number) => {
    if (secs < 0) return 'bg-transparent border border-slate-100 border-dashed'; // Future
    if (secs === 0) return 'bg-slate-100 border border-slate-200/50';
    if (secs < 30 * 60) return 'bg-blue-200 border border-blue-300 shadow-[0_0_10px_rgba(191,219,254,0.5)]';
    if (secs < 60 * 60) return 'bg-blue-400 border border-blue-500 shadow-[0_0_15px_rgba(96,165,250,0.6)]';
    if (secs < 120 * 60) return 'bg-blue-500 border border-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.7)]';
    return 'bg-blue-600 border border-blue-700 shadow-[0_0_25px_rgba(37,99,235,0.8)]';
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full flex flex-col p-2">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-1">Focus Activity</h1>
          <p className="text-slate-400 font-medium">{stats.totalHours}h {stats.totalMins}m total time</p>
        </div>
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl shadow-inner"><Flame className="w-6 h-6 text-blue-500" /></div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center overflow-x-auto custom-scrollbar-light pb-4">
        <div className="flex gap-2.5">
          {stats.grid.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-2.5">
              {week.map((day) => (
                <div 
                  key={day.date} 
                  className={`w-5 h-5 lg:w-6 lg:h-6 rounded-md transition-all duration-300 hover:scale-125 hover:z-10 cursor-help ${getIntensityClass(day.secs)}`}
                  title={day.secs >= 0 ? `${day.date}: ${Math.floor(day.secs/60)} mins` : ''}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-3 text-xs font-bold text-slate-400">
          <span>Less</span>
          <div className="flex gap-2">
            <div className={`w-4 h-4 rounded-sm ${getIntensityClass(0)}`} />
            <div className={`w-4 h-4 rounded-sm ${getIntensityClass(20*60)}`} />
            <div className={`w-4 h-4 rounded-sm ${getIntensityClass(40*60)}`} />
            <div className={`w-4 h-4 rounded-sm ${getIntensityClass(90*60)}`} />
            <div className={`w-4 h-4 rounded-sm ${getIntensityClass(150*60)}`} />
          </div>
          <span>More</span>
        </div>
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
