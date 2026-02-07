import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Crown, Shield, Moon, Zap, Flame, RefreshCw, CheckCircle2, Layers } from 'lucide-react';
import { Button } from './SharedUI'; 

const MiniBattery = ({ level, label }) => {
  const colors = { 1: 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]', 2: 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]', 3: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3].map(i => (
          <div key={i} className={`w-3 h-6 rounded-sm transition-all ${level >= i ? colors[level] : 'bg-zinc-800'}`} />
        ))}
      </div>
      <span className="text-[9px] uppercase font-bold text-zinc-500">{label}</span>
    </div>
  );
};

const INTENSITY_INFO = {
    low: { 
        desc: "(Chill, Safe, Non-Sexual). The goal is emotional safety and comfort.",
        iconColor: "text-blue-400",
        iconBg: "bg-blue-500/10",
        textColor: "text-blue-400/60"
    },
    medium: { 
        desc: "(Play, Tension, \"The Bridge\"). The goal is to build a charge. Possibility of sex without the demand.",
        iconColor: "text-amber-400",
        iconBg: "bg-amber-500/10",
        textColor: "text-amber-400/60"
    },
    high: { 
        desc: "(Erotic, Adventure, Release).",
        iconColor: "text-rose-400",
        iconBg: "bg-rose-500/10",
        textColor: "text-rose-400/60"
    }
};

export default function Play({ profile, deck, sharedState, onSyncInput, onLeadSelection, onFinalSelection, onResetSync, theme }) {
  const [localStage, setLocalStage] = useState('mode_selection'); 
  const [shortlist, setShortlist] = useState([]);
  
  const isLead = profile.isUserLead;
  const myData = isLead ? sharedState?.sync_data_lead : sharedState?.sync_data_partner;

  useEffect(() => {
    if (sharedState?.sync_stage === 'idle') {
        setLocalStage('mode_selection');
        setShortlist([]);
    }
  }, [sharedState?.sync_stage]);

  useEffect(() => {
    if (sharedState?.sync_stage === 'input' && !myData) {
        setLocalStage('mood');
    }
  }, [sharedState?.sync_stage, myData]);

  const handleModeSelect = (mode) => {
    setLocalStage('mood'); 
  };

  const handleIntensitySelect = (level) => {
    // Battery defaults to 3 since selection was removed
    onSyncInput({ battery: 3, intensity: level });
  };

  // --- STAGE 0: ALREADY CONNECTED (CONGRATULATIONS SCREEN) ---
  if (sharedState?.sync_stage === 'active') {
     return (
        <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-8 animate-in zoom-in duration-500 px-6">
           <div className="bg-emerald-500/10 p-8 rounded-full border border-emerald-500/20 ring-4 ring-emerald-500/10">
               <CheckCircle2 size={64} className="text-emerald-500" />
           </div>
           <div>
               <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Congratulations</h1>
               <p className="text-zinc-400 mt-2 text-sm leading-relaxed">You have completed a connection.</p>
           </div>
           
           <button onClick={onResetSync} className={`w-full py-4 uppercase font-black tracking-widest text-xs rounded-xl text-white ${theme.solid} ${theme.glow}`}>
               Start New Connection
           </button>
        </div>
     );
  }

  // --- WAITING SCREEN ---
  if (myData && sharedState?.sync_stage === 'input') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in px-6">
        <div className="bg-zinc-900 p-8 rounded-full border border-zinc-800 relative">
           <RefreshCw size={40} className={`${theme.text} animate-spin`} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Vibe Locked In</h2>
          <p className="text-zinc-500 text-xs mt-2 font-bold uppercase tracking-widest">Waiting for partner...</p>
        </div>
        <button onClick={onResetSync} className="text-[10px] text-rose-500 uppercase tracking-widest font-bold mt-8 border-b border-rose-500/30">Reset</button>
      </div>
    );
  }

  // --- MODE SELECTION ---
  if (sharedState?.sync_stage === 'idle' && localStage === 'mode_selection') {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500 h-full flex flex-col justify-center px-6 space-y-6">
        <div className="text-center mb-2">
            <Sparkles size={48} className={`mx-auto ${theme.text} mb-4`} />
            <h2 className="text-3xl font-light text-white">Connection Mode</h2>
        </div>

        <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-full border ${profile.isUserLead ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
            {profile.isUserLead ? <Crown size={14} /> : <Shield size={14} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
                {profile.isUserLead ? "You are In Charge" : "Partner is In Charge"}
            </span>
        </div>

        <button onClick={() => handleModeSelect('standard')} className="w-full p-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 transition-all text-left group active:scale-95">
          <div className="flex justify-between items-center mb-2"><h3 className="text-xl font-bold text-white">Standard Sync</h3><ArrowRight className="text-zinc-600 group-hover:text-white" /></div>
          <p className="text-xs text-zinc-500">You pick 3, they pick 1. The classic negotiation.</p>
        </button>
        <button onClick={() => handleModeSelect('blind')} className="w-full p-6 rounded-3xl border text-left transition-all group relative overflow-hidden border-amber-500/50 bg-amber-900/10 hover:bg-amber-900/20 active:scale-95">
          <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><h3 className="text-xl font-bold text-white">Blind Date</h3><span className="text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded uppercase">Free</span></div><ArrowRight className="text-amber-500 group-hover:translate-x-1 transition-transform" /></div>
          <p className="text-xs text-zinc-400">High stakes. System picks the winner. Result hidden.</p>
        </button>
      </div>
    );
  }

  // --- MOOD INPUT ---
  const showMoodInput = (sharedState?.sync_stage === 'idle' && localStage === 'mood') || (sharedState?.sync_stage === 'input' && !myData);

  if (showMoodInput) {
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
        <div className="text-center space-y-2 mb-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">
            {profile.isUserLead ? <Crown size={12} className="text-amber-400" /> : <Shield size={12} className="text-blue-400" />}
            {profile.isUserLead ? "You are In Charge" : "Partner is In Charge"}
          </div>
          <h2 className="text-2xl font-light text-white tracking-tight">Select Intensity</h2>
        </div>
        
        <div className="px-4 flex-1 flex flex-col space-y-8 justify-center pb-20">
          
          {/* INTENSITY SECTION */}
          <div className="grid grid-cols-1 gap-3">
            {['low', 'medium', 'high'].map(id => {
                const info = INTENSITY_INFO[id];
                return (
                <button key={id} onClick={() => handleIntensitySelect(id)} className="p-5 rounded-2xl border text-left transition-all bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800 group active:scale-95">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4 w-full">
                            {/* FIXED COLORED ICON CONTAINER */}
                            <div className={`h-12 w-12 flex items-center justify-center rounded-full ${info.iconBg} ${info.iconColor} capitalize shrink-0`}>
                                {id === 'low' ? <Moon size={20}/> : id === 'medium' ? <Zap size={20}/> : <Flame size={20}/>}
                            </div>
                            
                            {/* TEXT SECTION */}
                            <div className="flex-1">
                                <h3 className="font-bold text-zinc-300 group-hover:text-white capitalize text-base flex items-center gap-2">
                                    {id} Intensity
                                </h3>
                                {/* MATCHED COLOR DESC */}
                                <p className={`text-xs mt-1 leading-snug ${info.textColor}`}>
                                    {info.desc}
                                </p>
                            </div>
                        </div>
                        <ArrowRight size={20} className="text-zinc-700 group-hover:text-white self-center ml-2" />
                    </div>
                </button>
            )})}
          </div>
        </div>
      </div>
    );
  }

  // --- STAGE 5: LEAD PICKS 3 ---
  if (sharedState?.sync_stage === 'lead_picking') {
    if (!profile.isUserLead) {
       return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in">
          <Crown size={48} className="text-amber-500 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white">Partner is Choosing</h2>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto">The Lead is currently selecting 3 options for you.</p>
        </div>
       );
    }

    const toggleShortlist = (id) => {
      if (shortlist.includes(id)) { setShortlist(shortlist.filter(item => item !== id)); } 
      else { if (shortlist.length < 3) setShortlist([...shortlist, id]); }
    };

    const getIntensityIcon = (i) => {
        if(i === 'low') return <Moon size={14} className="text-blue-400" />;
        if(i === 'medium') return <Zap size={14} className="text-amber-400" />;
        return <Flame size={14} className="text-rose-400" />;
    };

    const intensityMap = { 'low': 1, 'medium': 2, 'high': 3, 1: 1, 2: 2, 3: 3 };
    const leadVal = intensityMap[sharedState.sync_data_lead.intensity] || 1;
    const partnerVal = intensityMap[sharedState.sync_data_partner.intensity] || 1;
    const targetVal = Math.min(leadVal, partnerVal); 
    const targetIntensity = targetVal === 3 ? 'high' : targetVal === 2 ? 'medium' : 'low';

    let options = deck.filter(c => 
        (typeof c.intensity === 'string' && c.intensity.toLowerCase() === targetIntensity) || 
        (c.intensity === targetVal)
    );
    if (options.length === 0) options = deck; 

    return (
      <div className="animate-in slide-in-from-right-4 pb-24 px-4 pt-2">
        <div className="bg-zinc-900/60 border border-zinc-800 p-6 mb-8 rounded-[2rem] shadow-xl flex justify-between items-end">
            <div className="flex flex-col items-center gap-2"><MiniBattery level={sharedState.sync_data_lead.battery} label="You" /><div className="flex items-center gap-1 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800">{getIntensityIcon(sharedState.sync_data_lead.intensity)} <span className="text-[9px] font-bold text-zinc-500 uppercase">{sharedState.sync_data_lead.intensity}</span></div></div>
            <div className="flex flex-col items-center gap-1 mb-2"><div className="flex items-center gap-1 mb-1"><Crown size={12} className="text-amber-500" /> <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">In Charge</span></div><div className={`px-3 py-1 ${theme.bgSoft} border ${theme.border} rounded-full`}><span className={`text-xs font-black uppercase ${theme.textLight} tracking-widest`}>{targetIntensity} Match</span></div></div>
            <div className="flex flex-col items-center gap-2"><MiniBattery level={sharedState.sync_data_partner?.battery || 1} label="Partner" /><div className="flex items-center gap-1 bg-zinc-900/50 px-2 py-1 rounded-md border border-zinc-800">{getIntensityIcon(sharedState.sync_data_partner?.intensity || 'low')} <span className="text-[9px] font-bold text-zinc-500 uppercase">{sharedState.sync_data_partner?.intensity}</span></div></div>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 scrollbar-hide pb-40">
            {options.map(card => {
              const isPicked = shortlist.includes(card.id);
              return (
                <button key={card.id} onClick={() => toggleShortlist(card.id)} disabled={!isPicked && shortlist.length >= 3} className={`w-full p-5 rounded-3xl border text-left transition-all relative ${isPicked ? `${theme.bgSoft} ${theme.borderStrong}` : 'bg-zinc-900/40 border-zinc-800 opacity-60 grayscale'}`}>
                    <div className="flex justify-between items-center mb-1"><h4 className={`font-bold ${isPicked ? 'text-white' : 'text-zinc-400'}`}>{card.title}</h4>{isPicked && <CheckCircle2 size={16} className={`${theme.text}`} />}</div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{card.desc}</p>
                </button>
              );
            })}
        </div>
        
        {shortlist.length === 3 && ( 
            <div className="fixed bottom-28 left-6 right-6 z-[100]">
                <button className={`w-full shadow-2xl ${theme.glow} py-4 text-lg rounded-xl font-bold text-white ${theme.solid}`} onClick={() => onLeadSelection(deck.filter(c => shortlist.includes(c.id)))}>
                    Send Shortlist
                </button>
            </div> 
        )}
      </div>
    );
  }

  // --- STAGE 6: PARTNER PICKS 1 ---
  if (sharedState?.sync_stage === 'partner_picking') {
    if (profile.isUserLead) {
       return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in">
          <Layers size={48} className="text-blue-500 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white">Final Choice</h2>
          <p className="text-zinc-500 text-sm">Waiting for partner to pick the winner.</p>
        </div>
       );
    }

    const pool = sharedState.sync_pool || [];

    if (pool.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-pulse">
                <RefreshCw size={32} className={`${theme.text} animate-spin mb-4`} />
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Loading Selections...</p>
            </div>
        );
    }

    return (
      <div className="animate-in slide-in-from-right-4 pb-24 px-4 pt-4">
         <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">The Final Call</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2">Choose one to activate</p>
         </div>
         <div className="space-y-4">
            {pool.map(card => (
               <button key={card.id} onClick={() => onFinalSelection(card)} className="w-full p-6 rounded-[2rem] bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:bg-emerald-950/20 transition-all group text-left relative overflow-hidden active:scale-95">
                  <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-3">
                        <span className={`h-2 w-2 rounded-full ${card.intensity === 'high' ? 'bg-rose-500' : card.intensity === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{card.category}</span>
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                     <p className="text-zinc-400 text-sm leading-relaxed">{card.desc}</p>
                  </div>
               </button>
            ))}
         </div>
      </div>
    );
  }

  // FALLBACK
  return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
          <RefreshCw size={24} className="animate-spin mb-4 text-zinc-700" />
          <p className="text-xs font-bold uppercase tracking-widest">Synchronizing...</p>
      </div>
  );
}