import React, { useState } from 'react';
import { LogOut, RefreshCw, User, XCircle, Link as LinkIcon, AlertTriangle } from 'lucide-react';

export default function Config({ profile, partnerProfile, onUpdateProfile, onLogout, onCreateLink, onJoinLink, onUnlink, onRefresh }) {
  
  const [linkMode, setLinkMode] = useState(null); 
  const [generatedCode, setGeneratedCode] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
        const code = await onCreateLink();
        setGeneratedCode(code);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
        await onJoinLink(joinCode);
        setLinkMode(null);
        setJoinCode('');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <header className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-black text-white tracking-tighter">Config</h2>
           <p className="text-zinc-500 font-medium">Customize your experience</p>
        </div>
        {/* REFRESH BUTTON */}
        <button onClick={onRefresh} className="p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <RefreshCw size={18} />
        </button>
      </header>

      {/* --- ACCOUNT SECTION --- */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <User size={12} /> Account & Partner
        </h3>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-4">
            
            {/* My Name */}
            <div>
                <label className="text-xs text-zinc-500 font-bold uppercase mb-2 block">My Name</label>
                <input 
                    type="text" 
                    value={profile?.name || ''} 
                    onChange={(e) => onUpdateProfile({ name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-violet-500 transition-all"
                />
            </div>

            {/* Partner Status */}
            <div className="pt-4 border-t border-zinc-800">
                <label className="text-xs text-zinc-500 font-bold uppercase mb-3 block">Connection Status</label>
                
                {profile?.couple_id ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <div className="text-emerald-400 font-bold flex items-center gap-2">
                                <LinkIcon size={16} /> Connected
                            </div>
                            <div className="text-zinc-400 text-sm mt-1">
                                Partner: <span className="text-white font-bold">{partnerProfile?.name || "Loading..."}</span>
                            </div>
                        </div>
                        <button onClick={onUnlink} className="p-2 bg-zinc-950 hover:bg-rose-950/30 text-zinc-500 hover:text-rose-500 rounded-lg transition-colors border border-zinc-800 hover:border-rose-900">
                            <XCircle size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {!linkMode ? (
                            <div className="flex gap-2">
                                <button onClick={() => {setLinkMode('create'); handleGenerate();}} className="flex-1 py-3 bg-violet-600 rounded-xl text-white font-bold text-sm hover:bg-violet-500">
                                    I'm Lead (Get Code)
                                </button>
                                <button onClick={() => setLinkMode('join')} className="flex-1 py-3 bg-zinc-800 rounded-xl text-white font-bold text-sm hover:bg-zinc-700">
                                    Join Partner
                                </button>
                            </div>
                        ) : (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 animate-in zoom-in-95">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-white font-bold text-sm">
                                        {linkMode === 'create' ? "Share this Code" : "Enter Partner Code"}
                                    </span>
                                    <button onClick={() => {setLinkMode(null); setError(null);}} className="text-zinc-500 hover:text-white"><XCircle size={16}/></button>
                                </div>

                                {linkMode === 'create' && (
                                    <div className="bg-zinc-900 rounded-lg p-3 text-center border border-zinc-800 mb-2 cursor-pointer" onClick={() => navigator.clipboard.writeText(generatedCode)}>
                                        {loading ? <span className="text-zinc-500 text-xs">Generating...</span> : 
                                            <span className="text-2xl font-mono font-black text-white tracking-widest">{generatedCode}</span>
                                        }
                                    </div>
                                )}

                                {linkMode === 'join' && (
                                    <div className="flex gap-2">
                                        <input 
                                            value={joinCode} 
                                            onChange={e => setJoinCode(e.target.value)} 
                                            placeholder="CODE"
                                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-center text-white font-mono uppercase outline-none"
                                        />
                                        <button onClick={handleJoin} disabled={loading || !joinCode} className="px-4 bg-emerald-600 rounded-lg text-white font-bold text-sm">
                                            {loading ? "..." : "Link"}
                                        </button>
                                    </div>
                                )}
                                {error && <p className="text-rose-500 text-xs mt-2 text-center">{error}</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </section>

      <button 
        onClick={onLogout}
        className="w-full py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-rose-950/10 hover:text-rose-500 hover:border-rose-900/30 transition-all mt-8"
      >
        <LogOut size={18} /> Sign Out
      </button>
      
      <div className="text-center pb-8">
        <p className="text-[10px] text-zinc-700 font-mono uppercase">Connection Night v1.3</p>
      </div>
    </div>
  );
}