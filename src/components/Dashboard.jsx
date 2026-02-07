import React, { useEffect, useState } from 'react';
import { Flag, Sparkles, Calendar, Moon, Flame, MessageCircle, Heart, Loader2, Crown, ArrowRight, HelpCircle, X, Coins, Zap, User, AlertTriangle, Lock } from 'lucide-react';
import { Card } from './SharedUI';
import { DAILY_QUESTS, MICRO_CONNECTIONS } from '../data/gameData';

export default function Dashboard({ 
  profile, 
  partnerProfile, 
  syncedConnection, 
  partnerSignal, 
  onSignal, 
  mySignal, 
  lastActivityDate, 
  oliveBranchActive, 
  oliveBranchSender, 
  oliveBranchAcceptedAt, 
  onOliveBranchClick, 
  sessionUserId, 
  syncStage, 
  onNavigate,
  theme // NOW RECEIVES FULL OBJECT
}) {
  const [showHelp, setShowHelp] = useState(false);

  const isWaitingForPartnerInput = syncStage === 'input';
  const isLeadPicking = syncStage === 'lead_picking';
  const isPartnerPicking = syncStage === 'partner_picking';

  const [dailyDrop, setDailyDrop] = useState({ label: 'Connection', quest: 'Loading daily quest...' });

  useEffect(() => {
    const prefs = partnerProfile?.partner_focus_areas || [];
    let availableTypes = MICRO_CONNECTIONS.filter(m => prefs.includes(m.id));
    if (availableTypes.length === 0) availableTypes = MICRO_CONNECTIONS;

    const todayStr = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
    const selectedType = availableTypes[Math.abs(hash) % availableTypes.length];

    if (selectedType && DAILY_QUESTS[selectedType.id]) {
        const rawQuest = DAILY_QUESTS[selectedType.id];
        let finalQuestText = "Spend quality time together.";
        if (Array.isArray(rawQuest)) finalQuestText = rawQuest[Math.abs(hash) % rawQuest.length];
        else if (typeof rawQuest === 'string') finalQuestText = rawQuest;
        setDailyDrop({ label: selectedType.label, quest: finalQuestText });
    }
  }, [partnerProfile]); 

  const focusLabel = dailyDrop.label;
  const quest = dailyDrop.quest;

  const SIGNAL_STYLES = {
    horny: { bg: "bg-orange-950/40", border: "border-orange-500/50", iconBg: "bg-orange-500", shadow: "shadow-[0_0_15px_rgba(249,115,22,0.4)]", text: "text-orange-200", strong: "text-orange-100" },
    needy: { bg: "bg-indigo-950/40", border: "border-indigo-500/50", iconBg: "bg-indigo-500", shadow: "shadow-[0_0_15px_rgba(99,102,241,0.4)]", text: "text-indigo-200", strong: "text-indigo-100" },
    touch: { bg: "bg-rose-950/40", border: "border-rose-500/50", iconBg: "bg-rose-500", shadow: "shadow-[0_0_15px_rgba(244,63,94,0.4)]", text: "text-rose-200", strong: "text-rose-100" },
    talkative: { bg: "bg-blue-950/40", border: "border-blue-500/50", iconBg: "bg-blue-500", shadow: "shadow-[0_0_15px_rgba(59,130,246,0.4)]", text: "text-blue-200", strong: "text-blue-100" }
  };
  const activeStyle = SIGNAL_STYLES[partnerSignal] || SIGNAL_STYLES['touch'];

  const [visualState, setVisualState] = useState('IDLE'); 
  useEffect(() => {
    if (oliveBranchAcceptedAt) {
      if ((Date.now() - new Date(oliveBranchAcceptedAt).getTime()) < 24 * 60 * 60 * 1000) setVisualState('GREEN');
      else setVisualState('IDLE');
    } else { setVisualState('IDLE'); }
  }, [oliveBranchAcceptedAt, oliveBranchActive]);

  const isSender = oliveBranchSender === sessionUserId;
  const isReceiver = oliveBranchActive && !isSender;
  let flagClass = "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white"; 
  let iconFill = "none";
  if (visualState === 'GREEN') { flagClass = "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.8)] scale-110 duration-500"; iconFill = "currentColor"; }
  else if (isReceiver) { flagClass = "bg-amber-500 border-amber-400 text-white animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)]"; iconFill = "currentColor"; }
  else if (oliveBranchActive && isSender) { flagClass = "bg-zinc-800/50 border-zinc-700 text-zinc-600 cursor-default"; iconFill = "none"; }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-700">
      
      <style>{`
        @keyframes fire-pulse {
          0% { box-shadow: 0 0 10px #f97316, 0 0 20px #dc2626, inset 0 0 5px #f59e0b; border-color: #f97316; }
          25% { box-shadow: 0 0 15px #fb923c, 0 0 30px #ef4444, inset 0 0 10px #fbbf24; border-color: #fb923c; }
          50% { box-shadow: 0 0 25px #ea580c, 0 0 40px #b91c1c, inset 0 0 5px #d97706; border-color: #ef4444; }
          75% { box-shadow: 0 0 15px #f97316, 0 0 30px #ef4444, inset 0 0 10px #f59e0b; border-color: #fb923c; }
          100% { box-shadow: 0 0 10px #f97316, 0 0 20px #dc2626, inset 0 0 5px #f59e0b; border-color: #f97316; }
        }
        .live-fire { animation: fire-pulse 1.5s infinite alternate ease-in-out; }
      `}</style>

      <div className="flex items-start justify-between mb-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Good Evening, {profile?.name || 'User'}.</h1>
          <div className="flex items-center gap-2 mb-1">
             {profile?.couple_id ? (
                <span className="text-zinc-500 text-xs font-medium flex items-center gap-1"><Heart size={10} className="text-rose-500 fill-rose-500" /> Linked with <span className="text-zinc-300">{partnerProfile?.name || 'Partner'}</span></span>
             ) : (
                <span className="text-zinc-500 text-xs font-medium flex items-center gap-1"><User size={10} /> No partner linked</span>
             )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {!syncedConnection ? (
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse">System: Not Synced</span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">System: Active Sync</span>
            )}
          </div>
        </div>
        
        {/* RECONNECT BUTTON */}
        <div className="flex flex-col items-center gap-1">
            <button onClick={onOliveBranchClick} className={`p-4 rounded-full border transition-all duration-300 ${flagClass}`}><Flag size={22} fill={iconFill} /></button>
            <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">Reconnect</span>
        </div>
      </div>

      {!profile?.couple_id && (
          <div onClick={() => onNavigate('setup')} className={`${theme.bgSoft} border ${theme.border} p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-zinc-900 transition-all`}>
              <div className={`h-10 w-10 ${theme.solid} rounded-full flex items-center justify-center shrink-0`}><Sparkles size={20} className="text-white" /></div>
              <div><h4 className="font-bold text-white text-sm">Connect Partner</h4><p className="text-zinc-400 text-xs">Tap to go to Config and link accounts.</p></div>
          </div>
      )}

      {isWaitingForPartnerInput && (
        <div className="animate-in slide-in-from-top-4 cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate('play')}>
           <div className={`${theme.bgSoft} border ${theme.border} p-4 rounded-xl flex items-center gap-4 shadow-lg ${theme.glow} hover:bg-zinc-900 transition-colors group`}>
              <div className={`bg-black/20 p-2 rounded-full`}><Loader2 size={20} className={`${theme.loader} animate-spin`} /></div>
              <div className="flex-1"><p className={`text-xs font-bold ${theme.textLight} uppercase tracking-wider`}>Sync in Progress</p><p className={`text-xs ${theme.loader} mt-1`}>Waiting for partner's input...</p></div>
              <ArrowRight size={16} className={`${theme.text} opacity-50 group-hover:opacity-100 transition-opacity`} />
           </div>
        </div>
      )}

      {isLeadPicking && (
        <div className="animate-in slide-in-from-top-4 cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate('play')}>
           <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4 shadow-lg shadow-amber-900/20 hover:bg-amber-900/30 transition-colors group">
              <div className="bg-amber-500/20 p-2 rounded-full"><Crown size={20} className="text-amber-400 animate-pulse" /></div>
              <div className="flex-1"><p className="text-xs font-bold text-amber-200 uppercase tracking-wider">{profile.isUserLead ? 'Your Turn' : 'Partner\'s Turn'}</p><p className="text-xs text-amber-400 mt-1">{profile.isUserLead ? 'Tap to pick 3 options.' : 'Lead is selecting options...'}</p></div>
              <ArrowRight size={16} className="text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity" />
           </div>
        </div>
      )}

      {isPartnerPicking && (
        <div className="animate-in slide-in-from-top-4 cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate('play')}>
           <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex items-center gap-4 shadow-lg shadow-blue-900/20 hover:bg-blue-900/30 transition-colors group">
              <div className="bg-blue-500/20 p-2 rounded-full"><Sparkles size={20} className="text-blue-400 animate-pulse" /></div>
              <div className="flex-1"><p className="text-xs font-bold text-blue-200 uppercase tracking-wider">{!profile.isUserLead ? 'Final Choice' : 'Waiting'}</p><p className="text-xs text-blue-400 mt-1">{!profile.isUserLead ? 'Tap to choose the final plan.' : 'Partner is making the final choice.'}</p></div>
              <ArrowRight size={16} className="text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
           </div>
        </div>
      )}

      {isReceiver && visualState !== 'GREEN' && (
        <div className="animate-in slide-in-from-top-2 duration-500">
          <button onClick={onOliveBranchClick} className="w-full bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 flex items-center gap-4 text-left hover:bg-amber-500/20 transition-all">
            <div className="bg-amber-500 p-2 rounded-lg text-black animate-pulse"><Flag size={20} fill="currentColor" /></div>
            <div className="flex-1"><p className="text-xs font-bold text-amber-200 uppercase tracking-wider">Olive Branch Extended</p><p className="text-xs text-amber-500/80 mt-1">{profile.partnerName} wants to reconnect. Tap to Accept.</p></div>
          </button>
        </div>
      )}

      {oliveBranchActive && isSender && visualState !== 'GREEN' && (
        <div className="animate-in slide-in-from-top-2 duration-500">
           <div className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center gap-2">
              <span className="h-2 w-2 bg-zinc-500 rounded-full animate-pulse"/>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Waiting for partner...</span>
           </div>
        </div>
      )}

      {syncedConnection && (
        <div className="animate-in slide-in-from-right-4 duration-500">
          <div className="relative rounded-3xl overflow-hidden live-fire border-2 bg-zinc-900">
             <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-red-950/40 z-0"></div>
             <div className="relative z-10 p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 bg-zinc-950/50 px-2 py-1 rounded text-[10px] font-bold text-orange-400 uppercase tracking-widest border border-orange-500/30"><Flame size={12} fill="currentColor" /> Synced Plan</div>
                    <div className="flex items-center gap-1 text-orange-200/50 text-xs font-bold uppercase tracking-tighter"><Calendar size={12} /> Today</div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-1 tracking-tight drop-shadow-md">{syncedConnection.activity.title === 'BLIND_DATE' ? 'Mystery Date' : syncedConnection.activity.title}</h3>
                <p className="text-zinc-300 text-sm mb-4 leading-relaxed">{syncedConnection.activity.title === 'BLIND_DATE' ? 'Details locked until tonight...' : syncedConnection.activity.desc}</p>
             </div>
          </div>
        </div>
      )}

      {partnerSignal && (
        <div className="animate-in slide-in-from-top-4 duration-500 cursor-pointer" onClick={() => onSignal(null)}>
          <Card highlight={true} className={`${activeStyle.border} ${activeStyle.bg} hover:brightness-110 transition-all active:scale-95`}>
            <div className="flex items-start gap-4">
              <div className={`${activeStyle.iconBg} rounded-full p-3 text-white ${activeStyle.shadow} animate-pulse`}>
                {partnerSignal === 'horny' ? <Flame size={24} fill="currentColor" /> : partnerSignal === 'needy' ? <Moon size={24} fill="currentColor" /> : partnerSignal === 'talkative' ? <MessageCircle size={24} fill="currentColor" /> : <Heart size={24} fill="currentColor" />}
              </div>
              <div className="flex-1"><h3 className="text-white font-bold text-lg uppercase tracking-wide">Partner Signal</h3><p className={`${activeStyle.text} text-sm mt-1 leading-relaxed`}>{profile.partnerName} is feeling <strong className={`${activeStyle.strong} uppercase`}>{partnerSignal}</strong>.</p></div>
            </div>
          </Card>
        </div>
      )}

      {/* --- DYNAMIC DAILY DROP --- */}
      <Card className={`${theme.border} ${theme.glow} bg-gradient-to-tr from-zinc-900 via-zinc-900 to-black`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Sparkles size={16} className={`${theme.textLight}`} /><span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textLight}`}>Daily Drop</span></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 leading-tight"><span className={`${theme.textLight} font-black uppercase tracking-tighter mr-2`}>{focusLabel}:</span>{quest}</h2>
      </Card>

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.15em]">Send Your Vibe</h3>
          {mySignal && (<span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textLight} animate-pulse`}>Transmitting...</span>)}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[{ id: 'horny', icon: Flame, label: 'Horny', color: 'bg-orange-600' }, { id: 'needy', icon: Moon, label: 'Needy', color: 'bg-indigo-500' }, { id: 'talkative', icon: MessageCircle, label: 'Talkative', color: 'bg-blue-500' }, { id: 'touch', icon: Heart, label: 'Touch', color: 'bg-rose-500' }].map(signal => (
            <button key={signal.id} onClick={() => onSignal(signal.id)} className={`flex-1 flex flex-col items-center gap-3 p-2 rounded-xl transition-all duration-300 ${mySignal === signal.id ? 'bg-zinc-800' : 'hover:bg-zinc-900'}`}>
              <div className={`p-4 rounded-full transition-all duration-500 ${mySignal === signal.id ? `${signal.color} text-white shadow-lg` : 'bg-zinc-900 text-zinc-500'}`}><signal.icon size={24} fill={mySignal === signal.id ? "currentColor" : "none"} /></div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${mySignal === signal.id ? 'text-white' : 'text-zinc-500'}`}>{signal.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- FOOTER BUTTONS --- */}
      <div className="flex flex-col items-center mt-8 pb-4 gap-4">
        <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-white transition-colors uppercase tracking-widest bg-zinc-900/50 px-5 py-3 rounded-full border border-zinc-800 hover:border-zinc-500/30">
            <HelpCircle size={16} /> <span>How to Play</span>
        </button>

        {/* --- DYNAMIC LOCKBOX BUTTON --- */}
        <button 
            onClick={() => onNavigate('lockbox')} 
            className={`flex items-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest bg-zinc-900/50 px-5 py-3 rounded-full border ${theme.border} ${theme.text} hover:text-white hover:border-white/50 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}
        >
            <Lock size={16} /> <span>The Lockbox</span>
        </button>

        {(!profile?.partner_focus_areas || profile.partner_focus_areas.length === 0) && (
            <div onClick={() => onNavigate('setup')} className="flex items-center gap-2 cursor-pointer animate-pulse">
                <AlertTriangle size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Update Love Preferences in Config</span>
            </div>
        )}
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto relative ring-1 ring-white/10">
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-5 flex justify-between items-center z-10">
                    <h2 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2"><Crown size={16} className={`${theme.text}`} /> Game Guide</h2>
                    <button onClick={() => setShowHelp(false)} className="bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                <div className="p-6 space-y-8">
                    <div className="flex gap-4"><div className="shrink-0 bg-zinc-800 p-3 rounded-xl text-rose-500 h-fit"><Flag size={20} fill="currentColor" /></div><div><h3 className="text-white font-bold text-sm">The White Flag</h3><p className="text-zinc-400 text-xs mt-1 leading-relaxed">Tap this when you feel distant or need to resolve conflict. It's a silent signal that says "I want to fix this."</p></div></div>
                    <div className="flex gap-4"><div className="shrink-0 bg-zinc-800 p-3 rounded-xl text-violet-500 h-fit"><Sparkles size={20} fill="currentColor" /></div><div><h3 className="text-white font-bold text-sm">Connection Sync</h3><p className="text-zinc-400 text-xs mt-1 leading-relaxed">Tap the big <span className="text-white font-bold">Play Button</span> to start. Rate your battery, and the app suggests matching activities.</p></div></div>
                    
                    {/* RESTORED TOKEN SECTION */}
                    <div className="flex gap-4"><div className="shrink-0 bg-zinc-800 p-3 rounded-xl text-amber-500 h-fit"><Coins size={20} fill="currentColor" /></div><div><h3 className="text-white font-bold text-sm">Earning Tokens</h3><p className="text-zinc-400 text-xs mt-1 leading-relaxed">Fairness is key. If you <span className="text-white font-bold">compromise</span> (you wanted High intensity but agreed to Low), you earn 1 Token.</p></div></div>
                    
                    <div className="flex gap-4"><div className="shrink-0 bg-zinc-800 p-3 rounded-xl text-emerald-500 h-fit"><Calendar size={20} /></div><div><h3 className="text-white font-bold text-sm">The Daily Drop</h3><p className="text-zinc-400 text-xs mt-1 leading-relaxed">Every day, you get a "Daily Quest" tailored to your partner's love language.</p></div></div>
                </div>
                <div className="p-5 border-t border-zinc-800 bg-zinc-900/50">
                    <button onClick={() => setShowHelp(false)} className="w-full py-3 bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">Got it</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}