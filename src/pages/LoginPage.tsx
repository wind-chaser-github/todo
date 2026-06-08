import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useTodoStore } from '../store/useTodoStore';
import BlurText from '../components/react-bits/BlurText/BlurText';
import Particles from '../components/react-bits/Particles/Particles';

export function LoginPage() {
  const navigate = useNavigate();
  const { loadFromCloud, setAccessCode, accessCode } = useTodoStore();
  
  useEffect(() => {
    if (accessCode) {
      navigate('/board', { replace: true });
    }
  }, [accessCode, navigate]);

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setIsLoading(true);
    // Attempt to load from cloud
    await loadFromCloud(code.trim());
    setAccessCode(code.trim());
    setIsLoading(false);
    navigate('/board');
  };

  const handleGenerate = () => {
    setCode(`focus-${nanoid(6)}`);
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={['#ffffff', '#a7f3d0']}
          particleCount={100}
          particleSpread={10}
          speed={0.05}
          particleBaseSize={150}
          alphaParticles={true}
        />
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-emerald-400/20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(52,211,153,0.3)] border border-emerald-400/30">
             <KeyRound className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            <BlurText text="Access Code" delay={50} />
          </h1>
          <p className="text-slate-400 font-medium">One key for your entire focus universe.</p>
        </div>

        <AnimatePresence mode="wait">
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="Enter or create an access code"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-4 text-white text-center text-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all placeholder-slate-600 font-mono tracking-widest"
                />
                <button 
                  disabled={!code.trim() || isLoading}
                  className="w-full bg-emerald-400 text-slate-900 font-black text-lg py-4 rounded-2xl hover:bg-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? <Sparkles className="w-5 h-5 animate-spin" /> : 'Enter Workspace'}
                  {!isLoading && <ArrowRight className="w-5 h-5" />}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-800 text-center">
                <p className="text-slate-500 mb-4 text-sm font-medium">Create any memorable code, or let us generate one:</p>
                <button 
                  onClick={handleGenerate}
                  className="w-full bg-transparent border-2 border-slate-700 text-slate-400 font-bold py-3 rounded-2xl hover:border-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Auto-Generate
                </button>
              </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
