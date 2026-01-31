import React, { useEffect, useState } from 'react';
import { Flag, Sparkles, Calendar, Moon, Flame, MessageCircle, Heart, Loader2, Crown, ArrowRight } from 'lucide-react';
import { Card } from './SharedUI';
import { DAILY_QUESTS, MICRO_CONNECTIONS } from '../data/constants';

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
  onNavigate 
}) {
  const isWaitingForPartnerInput = syncStage === 'input';
  const isLeadPicking = syncStage === 'lead_picking';
  const isPartnerPicking = syncStage === 'partner_picking';

  const todayStr = new Date().toDateString();
  let dateHash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    dateHash = todayStr.charCodeAt(i) + ((dateHash << 5) - dateHash);
  }
  let rawOptions = partnerProfile?.partner_focus_areas?.length > 0 ? partnerProfile.partner_focus_areas : ['hugs'];
  const validOptions = rawOptions.filter(id => DAILY_QUESTS[id]);
  const finalOptions = validOptions.length > 0 ? validOptions : ['hugs'];
  const dailyId = finalOptions[Math.abs(dateHash) % finalOptions.length];
  let quest = "Spend time together.";
  const rawQuestData = DAILY_QUESTS[dailyId];
  if (Array.isArray(rawQuestData)) {
    const questIndex = Math.abs(dateHash) % rawQuestData.length;
    quest = rawQuestData[questIndex];
  } else if (typeof rawQuestData === 'string') {
    quest = rawQuestData;
  }
  const focusLabel = MICRO_CONNECTIONS.find(m => m.id === dailyId)?.label || 'Connection';

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
      const acceptedTime = new Date(oliveBranchAcceptedAt).getTime();
      const now = Date.now();
      const msSinceAccept = now - acceptedTime;
      const msInDay = 24 * 60 * 60 * 1000;
      if (msSinceAccept < msInDay) setVisualState('GREEN');
      else setVisualState('IDLE');
    } else {
      setVisualState('IDLE');
    }
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
      <div className="flex items-center justify-between mb-4 pt-2">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Good Evening, {profile.name}.</h1>
          <div className="mt-2 flex items-center gap-2">
            {!syncedConnection ? (
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse">System: Not Synced</span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">System: Active Sync</span>
            )}
          </div>
        </div>
        <button onClick={onOliveBranchClick} className={`p-4 rounded-full border transition-all duration-300 ${flagClass}`}><Flag size={22} fill={iconFill} /></button>
      </div>

      {isWaitingForPartnerInput && (
        <div className="animate-in slide-in-from-top-4 cursor-pointer active:scale-95 transition-transform" onClick={() => onNavigate('play')}>
           <div className="bg-violet-900/20 border border-violet-500/30 p-4 rounded-xl flex items-center gap-4 shadow-lg shadow-violet-900/20 hover:bg-violet-900/30 transition-colors group">
              <div className="bg-violet-500/20 p-2 rounded-full"><Loader2 size={20} className="text-violet-400 animate-spin" /></div>
              <div className="flex-1"><p className="text-xs font-bold text-violet-200 uppercase tracking-wider">Sync in Progress</p><p className="text-xs text-violet-400 mt-1">Waiting for partner's input...</p></div>
              <ArrowRight size={16} className="text-violet-500 opacity-50 group-hover:opacity-100 transition-opacity" />
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
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">Olive Branch Extended</p>
              <p className="text-xs text-amber-500/80 mt-1">{profile.partnerName} wants to reconnect. Tap to Accept.</p>
            </div>
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
          <Card className="border-emerald-500/40 bg-gradient-to-br from-zinc-900 to-emerald-950/20">
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 bg-zinc-800 px-2 py-1 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-widest"><Sparkles size={12} /> Synced Plan</div>
                <div className="flex items-center gap-1 text-zinc-500 text-xs font-bold uppercase tracking-tighter"><Calendar size={12} /> Today</div>
             </div>
             <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{syncedConnection.activity.title === 'BLIND_DATE' ? 'Mystery Date' : syncedConnection.activity.title}</h3>
             <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{syncedConnection.activity.title === 'BLIND_DATE' ? 'Details locked until tonight...' : syncedConnection.activity.desc}</p>
          </Card>
        </div>
      )}

      {partnerSignal && (
        <div className="animate-in slide-in-from-top-4 duration-500 cursor-pointer" onClick={() => onSignal(null)}>
          <Card highlight={true} className={`${activeStyle.border} ${activeStyle.bg} hover:brightness-110 transition-all active:scale-95`}>
            <div className="flex items-start gap-4">
              <div className={`${activeStyle.iconBg} rounded-full p-3 text-white ${activeStyle.shadow} animate-pulse`}>
                {partnerSignal === 'horny' ? <Flame size={24} fill="currentColor" /> : partnerSignal === 'needy' ? <Moon size={24} fill="currentColor" /> : partnerSignal === 'talkative' ? <MessageCircle size={24} fill="currentColor" /> : <Heart size={24} fill="currentColor" />}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg uppercase tracking-wide">Partner Signal</h3>
                <p className={`${activeStyle.text} text-sm mt-1 leading-relaxed`}>
                  {profile.partnerName} is feeling <strong className={`${activeStyle.strong} uppercase`}>{partnerSignal}</strong>.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="border-violet-500/20 shadow-violet-900/10 bg-gradient-to-tr from-zinc-900 via-zinc-900 to-violet-900/5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Sparkles size={16} className="text-violet-400" /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">Daily Drop</span></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 leading-tight"><span className="text-violet-400 font-black uppercase tracking-tighter mr-2">{focusLabel}:</span>{quest}</h2>
      </Card>

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.15em]">Send Your Vibe</h3>
          {mySignal && (<span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)] animate-pulse">Transmitting...</span>)}
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

      {/* --- SYSTEM GUIDE --- */}
      <div className="mt-8 border-t border-zinc-800 pt-6 px-2 opacity-50 hover:opacity-100 transition-opacity pb-10">
         <div className="flex items-start gap-4 mb-4">
            <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400"><Flag size={16} /></div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">The White Flag</p>
               <p className="text-xs text-zinc-400 mt-1">A signal for peace. Use it to reach out when you feel distant. If partner accepts, it stays green for 24h.</p>
            </div>
         </div>
         <div className="flex items-start gap-4">
            <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400"><Sparkles size={16} /></div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Earning Tokens</p>
               <p className="text-xs text-zinc-400 mt-1">Earn 'Karma Tokens' when you want high intensity but compromise for your partner's lower capacity.</p>
            </div>
         </div>
      </div>
    </div>
  );
}