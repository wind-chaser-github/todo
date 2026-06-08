import React from 'react';
import { Inbox, Calendar, Sun, Clock, Hash, Settings, Search, LayoutGrid } from 'lucide-react';
import { useTodoStore } from '../../store/useTodoStore';

interface SidebarProps {
  onOpenSettings: () => void;
}

export function Sidebar({ onOpenSettings }: SidebarProps) {
  const { todos } = useTodoStore();
  
  // Basic stats for professional feel
  const overdueCount = todos.filter(t => t.dueDate && t.dueDate < Date.now() && !t.completed).length;
  const todayCount = todos.filter(t => {
    if (!t.dueDate) return false;
    const diffHours = (t.dueDate - Date.now()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours < 24 && !t.completed;
  }).length;

  return (
    <div className="w-[260px] h-full flex flex-col bg-[#080808] border-r border-white/5 text-slate-400 p-4 shrink-0">
      {/* Workspace Header */}
      <div className="flex items-center px-2 py-3 mb-6 group cursor-pointer">
        <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center mr-3 font-bold text-sm shadow-[0_0_10px_rgba(99,102,241,0.2)]">
          C
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors tracking-wide">Chronos AI</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Workspace</p>
        </div>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* Core Views */}
        <div className="space-y-1">
          <NavItem icon={<Inbox className="w-4 h-4" />} label="Inbox" count={todos.filter(t => !t.dueDate && !t.completed).length} />
          <NavItem icon={<Sun className="w-4 h-4" />} label="Today" count={todayCount} active />
          <NavItem icon={<Calendar className="w-4 h-4" />} label="Upcoming" />
          <NavItem icon={<LayoutGrid className="w-4 h-4" />} label="All Tasks" count={todos.length} />
        </div>

        {/* Filters */}
        <div className="space-y-1">
          <div className="px-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
            Filters
          </div>
          <NavItem icon={<Clock className="w-4 h-4 text-rose-500/70" />} label="Overdue" count={overdueCount} />
          <NavItem icon={<Search className="w-4 h-4" />} label="AI Search" />
        </div>

        {/* Projects */}
        <div className="space-y-1">
          <div className="px-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Projects
          </div>
          <NavItem icon={<Hash className="w-4 h-4" />} label="Engineering" />
          <NavItem icon={<Hash className="w-4 h-4" />} label="Design" />
          <NavItem icon={<Hash className="w-4 h-4" />} label="Personal" />
        </div>
      </div>

      {/* Footer / Settings */}
      <div className="pt-4 mt-auto border-t border-white/5 space-y-2">
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center px-2 py-2 text-sm rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all group"
        >
          <Settings className="w-4 h-4 mr-3 text-slate-500 group-hover:text-indigo-400 transition-colors" />
          <span>AI Engine Config</span>
        </button>
      </div>
    </div>
  );
}

// Helper Nav Item component
function NavItem({ icon, label, count, active = false }: { icon: React.ReactNode; label: string; count?: number; active?: boolean }) {
  return (
    <button className={`w-full flex items-center px-2 py-1.5 rounded-lg text-sm transition-all group ${active ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'}`}>
      <span className={`mr-3 ${active ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${active ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
