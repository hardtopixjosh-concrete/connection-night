import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff, Plus, Flame, HelpCircle, XCircle, Shield, Key, ArrowRight, Trash2, StopCircle, RefreshCw, Settings, Check, RotateCcw } from 'lucide-react';
import { supabase } from '../supabase';
import { Button } from './SharedUI';

export default function Lockbox({ profile, theme, onExit }) {
  // --- STATE ---
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  
  // PIN Management State
  const [setupMode, setSetupMode] = useState(false); // True = Setting a NEW PIN
  const [isChangingPin, setIsChangingPin] = useState(false); // True = In the "Change" flow
  
  // App Logic
  const [activeTab, setActiveTab] = useState('shared'); 
  const [privacyRevealed, setPrivacyRevealed] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  
  // Item Creation
  const [isCreating, setIsCreating] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [isDualKey, setIsDualKey] = useState(false);

  // Dual Key Simulation
  const [unlockingId, setUnlockingId] = useState(null);

  // --- 0. INITIAL CHECK ---
  useEffect(() => {
      // If user has NO PIN in database, force Setup Mode immediately
      if (!profile.lockbox_pin) {
          setSetupMode(true);
      }
  }, [profile]);

  // --- 1. PIN PAD LOGIC ---
  const handleNumPress = async (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // AUTO-SUBMIT ON 4th DIGIT
      if (newPin.length === 4) {
        
        // A. SETTING A NEW PIN (First time OR Step 2 of Change)
        if (setupMode) {
            await supabase.from('profiles').update({ lockbox_pin: newPin }).eq('id', profile.id);
            // Reset all flags and unlock
            setSetupMode(false);
            setIsChangingPin(false);
            setIsUnlocked(true);
            setPin(''); 
            fetchItems();
        } 
        
        // B. VERIFYING OLD PIN (Step 1 of Change)
        else if (isChangingPin) {
             if (newPin === profile.lockbox_pin) {
                 // Correct! Now let them set the new one.
                 setTimeout(() => {
                     setPin('');
                     setSetupMode(true); // Enable "Set New" mode
                 }, 300);
             } else {
                 triggerShake();
             }
        }
        
        // C. NORMAL UNLOCK
        else {
            if (newPin === profile.lockbox_pin) {
                setTimeout(() => setIsUnlocked(true), 300);
                fetchItems();
            } else {
                triggerShake();
            }
        }
      }
    }
  };

  const triggerShake = () => {
      setShake(true);
      setTimeout(() => { setShake(false); setPin(''); }, 500);
  };

  const handleChangePin = () => {
      // Start the Secure Change Flow
      setIsUnlocked(false);   // Lock the screen
      setIsChangingPin(true); // Flag we are changing
      setPin('');             // Clear input
      setSetupMode(false);    // Ensure we verify first
  };

  const handleCancelChange = () => {
      // If they cancel during change, just exit the lockbox or reset
      onExit();
  };

  // --- 2. DATA & REALTIME ---
  const fetchItems = async () => {
    if (!profile.couple_id) return;
    setLoading(true);
    const { data } = await supabase
      .from('lockbox_items')
      .select('*')
      .eq('couple_id', profile.couple_id)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!profile.couple_id) return;
    const channel = supabase.channel('lockbox_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'lockbox_items', filter: `couple_id=eq.${profile.couple_id}` }, () => {
            fetchItems();
        })
        .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profile.couple_id]);

  // --- 3. ACTIONS ---
  const handleCreate = async () => {
    if (!newItemText.trim()) return;
    const type = activeTab === 'private' ? 'private' : 'shared';
    await supabase.from('lockbox_items').insert([{
      couple_id: profile.couple_id,
      author_id: profile.id,
      text: newItemText,
      type: type,
      is_dual_key: isDualKey
    }]);
    setNewItemText('');
    setIsDualKey(false);
    setIsCreating(false);
  };

  const handleReaction = async (itemId, reactionType) => {
    const item = items.find(i => i.id === itemId);
    const newReaction = item.reaction === reactionType ? null : reactionType;
    setItems(items.map(i => i.id === itemId ? { ...i, reaction: newReaction } : i));
    await supabase.from('lockbox_items').update({ reaction: newReaction }).eq('id', itemId);
  };

  const handleMoveToShared = async (item) => {
    if (window.confirm("Share this with your partner? It will appear in the Shared folder.")) {
      await supabase.from('lockbox_items').update({ type: 'shared' }).eq('id', item.id);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this entry forever?")) {
      setItems(currentItems => currentItems.filter(item => item.id !== id));
      await supabase.from('lockbox_items').delete().eq('id', id);
    }
  };

  // --- 4. DUAL KEY LOGIC ---
  const handleDualUnlock = async (item) => {
    const now = new Date();
    const attemptTime = item.unlock_attempt_at ? new Date(item.unlock_attempt_at) : null;
    const isRecent = attemptTime && (now - attemptTime < 30000); 

    if (isRecent && item.unlock_attempt_by !== profile.id) {
        const unlockUntil = new Date(now.getTime() + 60000).toISOString();
        await supabase.from('lockbox_items').update({ 
            unlocked_until: unlockUntil,
            unlock_attempt_at: null,
            unlock_attempt_by: null
        }).eq('id', item.id);
    } 
    else {
        await supabase.from('lockbox_items').update({ 
            unlock_attempt_at: new Date().toISOString(), 
            unlock_attempt_by: profile.id 
        }).eq('id', item.id);
    }
  };

  // --- DYNAMIC TITLE HELPER ---
  const getPinTitle = () => {
      if (setupMode) return "Set New Passcode";
      if (isChangingPin) return "Verify Current Passcode";
      return "Secure Access";
  };

  // --- RENDER: PIN PAD ---
  if (!isUnlocked) {
    return (
      <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 animate-in fade-in ${shake ? 'animate-shake' : ''}`}>
        <div className="mb-8 flex flex-col items-center">
            <div className={`p-4 rounded-full ${theme.bgSoft} mb-4 border ${theme.borderStrong}`}>
                {setupMode ? <Key size={32} className={theme.text} /> : <Lock size={32} className={theme.text} />}
            </div>
            <h2 className="text-white text-xl font-bold tracking-widest uppercase">{getPinTitle()}</h2>
            <p className="text-zinc-500 text-xs mt-2">
                {setupMode ? "Enter a new 4-digit PIN" : "Enter PIN to continue"}
            </p>
        </div>
        <div className="flex gap-4 mb-12">
            {[0, 1, 2, 3].map(i => (<div key={i} className={`w-4 h-4 rounded-full transition-all ${pin.length > i ? theme.solid : 'bg-zinc-800'}`} />))}
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleNumPress(num.toString())} className="h-20 w-20 rounded-full bg-zinc-900 border border-zinc-800 text-white text-2xl font-bold flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all">{num}</button>
            ))}
            <div />
            <button onClick={() => handleNumPress('0')} className="h-20 w-20 rounded-full bg-zinc-900 border border-zinc-800 text-white text-2xl font-bold flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all">0</button>
            
            {/* Context Aware Cancel Button */}
            {isChangingPin ? (
                <button onClick={handleCancelChange} className="h-20 w-20 rounded-full flex items-center justify-center text-zinc-500 hover:text-white"><RotateCcw /></button>
            ) : (
                <button onClick={onExit} className="h-20 w-20 rounded-full flex items-center justify-center text-zinc-500 hover:text-white"><XCircle /></button>
            )}
        </div>
        <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } } .animate-shake { animation: shake 0.3s ease-in-out; }`}</style>
      </div>
    );
  }

  // --- RENDER: MAIN VIEW ---
  const displayedItems = items.filter(i => {
      if (activeTab === 'shared') return i.type === 'shared';
      return i.type === 'private' && i.author_id === profile.id;
  });

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom-10 duration-500">
      
      {/* HEADER */}
      <div className="p-6 pb-2 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur shrink-0">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Shield size={20} className={theme.text} />
                <h1 className="text-xl font-bold text-white uppercase tracking-wider">The Lockbox</h1>
            </div>
            
            <div className="flex gap-2">
                {/* SETTINGS BUTTON FOR CHANGING PIN */}
                <button onClick={handleChangePin} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors"><Settings size={20} /></button>
                <button onClick={onExit} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white"><XCircle size={20} /></button>
            </div>
        </div>

        <div className="flex gap-2">
            <button onClick={() => setActiveTab('shared')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl border-b-2 transition-all ${activeTab === 'shared' ? `text-white ${theme.borderStrong} bg-zinc-900/50` : 'text-zinc-600 border-transparent'}`}>Shared</button>
            <button onClick={() => setActiveTab('private')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl border-b-2 transition-all ${activeTab === 'private' ? `text-white ${theme.borderStrong} bg-zinc-900/50` : 'text-zinc-600 border-transparent'}`}>My Eyes Only</button>
        </div>
      </div>

      {/* TOOLBAR */}
      {activeTab === 'shared' && (
          <div className="px-6 py-3 flex justify-between items-center bg-zinc-900/30 border-b border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Privacy Status</span>
              <button onClick={() => setPrivacyRevealed(!privacyRevealed)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${privacyRevealed ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                  {privacyRevealed ? <><Eye size={12}/> Revealed</> : <><EyeOff size={12}/> Blurred</>}
              </button>
          </div>
      )}

      {/* CONTENT LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? <div className={`text-center py-10 ${theme.text} text-xs uppercase animate-pulse`}>Decrypting...</div> : (
            <>
                {displayedItems.length === 0 && (
                    <div className="text-center py-20 text-zinc-600">
                        <Lock size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-bold">Safe & Empty</p>
                        <p className="text-xs mt-1">Add your deepest desires securely.</p>
                    </div>
                )}

                {displayedItems.map(item => {
                    const isBlurred = activeTab === 'shared' && !privacyRevealed;
                    
                    const now = new Date();
                    const unlockedUntil = item.unlocked_until ? new Date(item.unlocked_until) : null;
                    const isFullyUnlocked = unlockedUntil && now < unlockedUntil;
                    
                    const attemptTime = item.unlock_attempt_at ? new Date(item.unlock_attempt_at) : null;
                    const isAttemptActive = attemptTime && (now - attemptTime < 30000);
                    const isMeInitiator = item.unlock_attempt_by === profile.id;

                    const isLocked = item.is_dual_key && !isFullyUnlocked;
                    const isMe = item.author_id === profile.id;

                    return (
                        <div key={item.id} className={`relative p-5 rounded-2xl border bg-zinc-900/40 ${item.is_dual_key ? 'border-amber-900/30' : 'border-zinc-800'}`}>
                            {item.is_dual_key && <div className="absolute top-0 right-0 p-2"><Key size={12} className="text-amber-500" /></div>}

                            {isBlurred ? (
                                <div className="absolute inset-0 z-10 backdrop-blur-md bg-zinc-950/50 rounded-2xl flex items-center justify-center">
                                    <EyeOff size={24} className="text-zinc-600 opacity-50" />
                                </div>
                            ) : isLocked ? (
                                <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
                                    {isAttemptActive ? (
                                        <>
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mb-2"></div>
                                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                                                {isMeInitiator ? "Waiting for Partner..." : "Partner Key Inserted!"}
                                            </span>
                                            {!isMeInitiator && (
                                                <button onClick={() => handleDualUnlock(item)} className="mt-2 px-4 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-amber-500 transition-colors animate-pulse">
                                                    Turn Your Key
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="bg-amber-900/20 p-3 rounded-full mb-2"><Key size={20} className="text-amber-500" /></div>
                                            <p className="text-xs text-zinc-400 font-bold mb-3">Dual Key Encrypted</p>
                                            <button onClick={() => handleDualUnlock(item)} className="px-4 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-amber-500 transition-colors">Initiate Unlock</button>
                                        </>
                                    )}
                                </div>
                            ) : null}

                            <p className="text-zinc-300 text-sm leading-relaxed mb-4 font-medium">{item.text}</p>
                            
                            <div className="flex justify-between items-end border-t border-zinc-800 pt-3">
                                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{isMe ? 'You' : 'Partner'}</span>
                                {activeTab === 'shared' ? (
                                    <div className="flex gap-2 items-center">
                                        {isMe && <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-600 hover:text-rose-500 mr-2"><Trash2 size={14}/></button>}
                                        <button onClick={() => handleReaction(item.id, 'stop')} className={`p-2 rounded-lg transition-all ${item.reaction === 'stop' ? 'bg-rose-500/20 text-rose-500' : 'bg-zinc-900 text-zinc-600 hover:text-zinc-400'}`}><StopCircle size={16} /></button>
                                        <button onClick={() => handleReaction(item.id, 'curious')} className={`p-2 rounded-lg transition-all ${item.reaction === 'curious' ? 'bg-indigo-500/20 text-indigo-500' : 'bg-zinc-900 text-zinc-600 hover:text-zinc-400'}`}><HelpCircle size={16} /></button>
                                        <button onClick={() => handleReaction(item.id, 'fire')} className={`p-2 rounded-lg transition-all ${item.reaction === 'fire' ? 'bg-orange-500/20 text-orange-500' : 'bg-zinc-900 text-zinc-600 hover:text-zinc-400'}`}><Flame size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                        <button onClick={() => handleMoveToShared(item)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg ${theme.bgSoft} ${theme.text} text-[10px] font-bold uppercase`}>Share <ArrowRight size={12}/></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div className="mt-8 mb-4">
                    <button onClick={() => setShowHelp(true)} className="w-full py-4 rounded-2xl border border-dashed border-zinc-800 flex flex-col items-center gap-2 hover:bg-zinc-900/50 transition-colors group">
                        <HelpCircle size={20} className="text-zinc-600 group-hover:text-zinc-400" />
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400">How to use The Lockbox</span>
                    </button>
                </div>
            </>
        )}
      </div>

      {!isCreating && (
          <div className="p-4 bg-zinc-950 border-t border-zinc-800">
              <Button onClick={() => setIsCreating(true)} variant="primary" theme={theme} icon={Plus}>New Desire</Button>
          </div>
      )}

      {isCreating && (
          <div className="absolute inset-x-0 bottom-0 bg-zinc-900 border-t border-zinc-800 p-5 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full z-50">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-wide">Log New Desire</h3>
                  <button onClick={() => setIsCreating(false)} className="text-zinc-500"><XCircle size={20}/></button>
              </div>
              <textarea className={`w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-sm mb-4 focus:outline-none focus:${theme.borderStrong} transition-all`} rows={4} placeholder="Type something vulnerable..." value={newItemText} onChange={e => setNewItemText(e.target.value)} />
              <div className="flex items-center justify-between mb-6">
                  <div onClick={() => setIsDualKey(!isDualKey)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isDualKey ? 'bg-amber-900/20 border-amber-500/50' : 'bg-zinc-950 border-zinc-800'}`}>
                      <div className={`p-2 rounded-full ${isDualKey ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}><Key size={14} /></div>
                      <div><p className={`text-xs font-bold ${isDualKey ? 'text-amber-400' : 'text-zinc-400'}`}>Dual Key Lock</p><p className="text-[9px] text-zinc-500">Requires both to unlock.</p></div>
                  </div>
              </div>
              <Button onClick={handleCreate} variant="primary" theme={theme}>Encrypt & Save</Button>
          </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
                <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
                    <h2 className="text-white font-bold uppercase tracking-widest text-sm flex items-center gap-2"><Shield size={16} className={theme.text} /> Lockbox Guide</h2>
                    <button onClick={() => setShowHelp(false)}><X size={20} className="text-zinc-500 hover:text-white"/></button>
                </div>
                <div className="p-6 space-y-6">
                    <p className="text-zinc-400 text-xs leading-relaxed">
                        The Lockbox is an encrypted-feeling safe space for sharing high-stakes vulnerability, fantasies, and private desires. It functions as a safe space negotiation board.
                    </p>
                    
                    <div>
                        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Reactions</h3>
                        <p className="text-zinc-500 text-[10px] mb-2">Non-verbal feedback without pressure.</p>
                        <div className="space-y-2">
                            <div className="flex gap-3 items-center"><Flame size={14} className="text-orange-500" /> <span className="text-zinc-400 text-xs"><strong>Into It:</strong> Enthusiastic consent.</span></div>
                            <div className="flex gap-3 items-center"><HelpCircle size={14} className="text-indigo-500" /> <span className="text-zinc-400 text-xs"><strong>Curious:</strong> Interested, need info.</span></div>
                            <div className="flex gap-3 items-center"><StopCircle size={14} className="text-rose-500" /> <span className="text-zinc-400 text-xs"><strong>Hard Limit:</strong> A safe "No".</span></div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-2">Dual Key Security</h3>
                        <p className="text-zinc-400 text-xs leading-relaxed">
                            For the most private entries. A user can flag an item as "Dual Key" when creating it. To reveal, <strong className="text-amber-500">both partners</strong> must tap "Unlock" within 30 seconds of each other.
                        </p>
                    </div>
                </div>
                <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                    <button onClick={() => setShowHelp(false)} className={`w-full py-3 rounded-xl font-bold uppercase text-xs ${theme.solid} text-white`}>Close</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}