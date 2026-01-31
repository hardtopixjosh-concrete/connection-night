import React from 'react';
import { Sparkles, Zap, Heart, User } from 'lucide-react';

export default function Dashboard({ 
  profile, 
  partnerProfile, 
  syncedConnection, 
  partnerSignal, 
  mySignal, 
  onSignal, 
  lastActivityDate,
  syncStage,
  onNavigate
}) {

  // ... (Keep helper functions like getSignalColor, etc.) ...
  const getSignalColor = (s) => {
    if (s === 1) return 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]';
    if (s === 2) return 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]';
    if (s === 3) return 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]';
    return 'bg-zinc-800 border border-zinc-700';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER WITH PARTNER STATUS */}
      <header className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            Hello, {profile?.name || 'User'}
          </h2>
          
          {/* NEW: Partner Status Indicator */}
          <div className="flex items-center gap-2 mt-1">
            {profile?.couple_id ? (
                <>
                    <Heart size={12} className="text-rose-500 fill-rose-500" />
                    <span className="text-zinc-400 text-xs font-medium">
                        Linked with <span className="text-white">{partnerProfile?.name || 'Partner'}</span>
                    </span>
                </>
            ) : (
                <>
                    <User size={12} className="text-zinc-600" />
                    <span className="text-zinc-600 text-xs font-medium">No partner linked</span>
                </>
            )}
          </div>
        </div>
        
        {/* Date Display */}
        <div className="text-right">
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
        </div>
      </header>

      {/* IF NOT LINKED, SHOW PROMPT */}
      {!profile?.couple_id && (
          <div onClick={() => onNavigate('setup')} className="bg-violet-900/20 border border-violet-500/30 p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-violet-900/30 transition-all">
              <div className="h-10 w-10 bg-violet-600 rounded-full flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-white" />
              </div>
              <div>
                  <h4 className="font-bold text-white text-sm">Connect Partner</h4>
                  <p className="text-zinc-400 text-xs">Tap to go to Config and link accounts.</p>
              </div>
          </div>
      )}

      {/* ... (Keep the rest of your Dashboard widgets exactly as they were: Signals, Synced Connection, etc.) ... */}
      
      {/* Example Signal Section (Just to ensure the code works) */}
      {profile?.couple_id && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Daily Signals</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
             {/* ... Your signal buttons ... */}
             <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-3">
               <span className="text-xs font-bold text-zinc-500 uppercase">Me</span>
               <div className="flex gap-2">
                 {[1,2,3].map(i => (
                   <button key={i} onClick={() => onSignal(i)} className={`w-8 h-8 rounded-full transition-all ${mySignal === i ? getSignalColor(i) : 'bg-zinc-800 hover:bg-zinc-700'}`} />
                 ))}
               </div>
             </div>
             
             <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center gap-3">
               <span className="text-xs font-bold text-zinc-500 uppercase">{partnerProfile?.name || 'Partner'}</span>
               <div className={`w-12 h-12 rounded-full transition-all duration-500 ${getSignalColor(partnerSignal)}`} />
             </div>
          </div>
        </section>
      )}
    </div>
  );
}