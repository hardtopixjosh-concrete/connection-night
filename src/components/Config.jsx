import React, { useState, useEffect } from 'react';
import { LogOut, Save, RotateCcw, CheckCircle2, Trash2, Moon, Zap, Flame, RefreshCw, Link as LinkIcon, AlertTriangle, Copy, XCircle, User, Heart } from 'lucide-react';
import { Card, Button } from './SharedUI';
import { supabase } from '../supabase';

const LOVE_STYLES = [
  { id: 'compliments', label: 'Compliments', icon: '💬' },
  { id: 'conversations', label: 'Conversations', icon: '🗣️' },
  { id: 'hugs', label: 'Hugs', icon: '🤗' },
  { id: 'sitting_close', label: 'Sitting Close', icon: '🛋️' },
  { id: 'public_affection', label: 'Public Affection', icon: '🤝' },
  { id: 'massages', label: 'Massages', icon: '💆' },
  { id: 'activities', label: 'Activities', icon: '🏃' },
  { id: 'cuddling', label: 'Cuddling', icon: '🧸' },
  { id: 'acts', label: 'Acts of Service', icon: '🛠️' },
  { id: 'gifts', label: 'Gifts', icon: '🎁' },
  { id: 'flowers', label: 'Flowers', icon: '🌹' },
  { id: 'chores', label: 'Chores', icon: '🧹' }
];

export default function Config({ 
  profile, 
  partnerProfile,
  sharedState,
  onUpdateProfile, 
  onLogout, 
  onResetEconomy,
  activeDeck,
  onAddDeckCard,
  onDeleteDeckCard,
  onCreateLink,
  onJoinLink,
  onUnlink,
  onRefresh
}) {
  const [name, setName] = useState('');
  const [focusAreas, setFocusAreas] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Linking State
  const [linkMode, setLinkMode] = useState(null); 
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [linkError, setLinkError] = useState(null);
  
  // Deck Management State
  const [deckTab, setDeckTab] = useState('low'); 
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');

  // --- FIX 1: SYNC STATE WHEN PROFILE LOADS ---
  useEffect(() => {
    if (profile) {
        setName(profile.name || '');
        // Default to empty array if null
        setFocusAreas(profile.partner_focus_areas || []);
    }
  }, [profile]); 

  // --- FIX 2: DIRECT SAVE TO DATABASE ---
  const handleSave = async () => {
    setLoading(true);
    try {
        // 1. Update DB directly
        const { error } = await supabase
            .from('profiles')
            .update({ name, partner_focus_areas: focusAreas })
            .eq('id', profile.id);
            
        if (error) throw error;

        // 2. Update Local State (App.jsx)
        onUpdateProfile({ name, partner_focus_areas: focusAreas });

        // 3. Success Feedback
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    } catch (e) {
        alert("Error saving: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  const toggleFocus = (id) => {
    if (focusAreas.includes(id)) setFocusAreas(prev => prev.filter(item => item !== id));
    else setFocusAreas(prev => [...prev, id]);
  };

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    onAddDeckCard({ 
        title: newCardTitle, 
        desc: newCardDesc, 
        intensity: deckTab, 
        category: 'Custom' 
    });
    setNewCardTitle('');
    setNewCardDesc('');
  };

  // Linking Actions
  const handleGenerate = async () => {
    setLoading(true);
    try {
        const code = await onCreateLink();
        setGeneratedCode(code);
    } catch (e) { setLinkError(e.message); }
    setLoading(false);
  };

  const handleJoin = async () => {
    setLoading(true);
    setLinkError(null);
    try {
        await onJoinLink(joinCode);
        setLinkMode(null);
        setJoinCode('');
    } catch (e) { setLinkError(e.message); }
    setLoading(false);
  };

  const displayedCards = activeDeck.filter(c => c.intensity === deckTab);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in">
      <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white">Config</h1>
            <p className="text-zinc-400 text-sm mt-1">Settings & Content.</p>
          </div>
          <button onClick={onRefresh} className="p-2 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors">
            <RefreshCw size={20} />
          </button>
      </div>

      {/* --- IDENTITY & CONNECTION --- */}
      <Card title="Identity & Connection">
        <div className="space-y-6">
          
          {/* My Name */}
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Your Name</label>
            <input 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white mt-1 focus:border-violet-500 focus:outline-none" 
                value={name} 
                onChange={e => setName(e.target.value)} 
            />
          </div>

          {/* Connection Logic */}
          <div>
             <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">Partner Connection</label>
             
             {profile?.couple_id ? (
                // --- LINKED STATE ---
                <div className="space-y-3">
                    {partnerProfile ? (
                        // FULLY CONNECTED
                        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                            <div>
                                <div className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                                    <LinkIcon size={14} /> Connected
                                </div>
                                <div className="text-zinc-400 text-xs mt-1">
                                    Linked with <span className="text-white font-bold">{partnerProfile.name}</span>
                                </div>
                            </div>
                            <button onClick={onUnlink} className="p-2 bg-zinc-950 hover:bg-rose-950/30 text-zinc-600 hover:text-rose-500 rounded-lg transition-colors">
                                <XCircle size={18} />
                            </button>
                        </div>
                    ) : (
                        // WAITING FOR PARTNER
                        <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="text-amber-400 text-sm font-bold flex items-center gap-2">
                                        <AlertTriangle size={14} /> Waiting for Partner
                                    </div>
                                    <div className="text-zinc-500 text-[10px] mt-1 uppercase tracking-wide">
                                        Share this code:
                                    </div>
                                </div>
                                <button onClick={onUnlink} className="text-zinc-600 hover:text-rose-500"><XCircle size={16}/></button>
                            </div>
                            
                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center cursor-pointer group" onClick={() => navigator.clipboard.writeText(generatedCode || sharedState?.link_code)}>
                                <span className="text-2xl font-mono font-black text-white tracking-[0.2em]">
                                    {generatedCode || sharedState?.link_code || '...'}
                                </span>
                                <Copy size={16} className="text-zinc-600 group-hover:text-white transition-colors"/>
                            </div>
                        </div>
                    )}
                </div>
             ) : (
                // --- NOT LINKED STATE ---
                <div className="space-y-3">
                    {!linkMode ? (
                        <div className="flex gap-2">
                            <button onClick={() => {setLinkMode('create'); handleGenerate();}} className="flex-1 py-3 bg-violet-600 rounded-xl text-white font-bold text-xs hover:bg-violet-500 transition-colors">
                                I'm Lead (Get Code)
                            </button>
                            <button onClick={() => setLinkMode('join')} className="flex-1 py-3 bg-zinc-800 rounded-xl text-white font-bold text-xs hover:bg-zinc-700 transition-colors">
                                Join Partner
                            </button>
                        </div>
                    ) : (
                        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-white font-bold text-xs uppercase tracking-wide">
                                    {linkMode === 'create' ? "Generating..." : "Enter Code"}
                                </span>
                                <button onClick={() => {setLinkMode(null); setLinkError(null);}} className="text-zinc-500 hover:text-white"><XCircle size={16}/></button>
                            </div>

                            {linkMode === 'join' && (
                                <div className="flex gap-2">
                                    <input 
                                        value={joinCode} 
                                        onChange={e => setJoinCode(e.target.value)} 
                                        placeholder="CODE"
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-center text-white font-mono uppercase text-sm outline-none focus:border-violet-500"
                                    />
                                    <button onClick={handleJoin} disabled={loading || !joinCode} className="px-4 bg-emerald-600 rounded-lg text-white font-bold text-xs">
                                        {loading ? "..." : "Link"}
                                    </button>
                                </div>
                            )}
                            {linkError && <p className="text-rose-500 text-[10px] mt-2 text-center font-bold">{linkError}</p>}
                        </div>
                    )}
                </div>
             )}
          </div>
        </div>
      </Card>

      {/* --- LOVE LANGUAGES --- */}
      <Card title="My Love Preferences">
        <div className="grid grid-cols-3 gap-2">
          {LOVE_STYLES.map(item => {
            const isSelected = focusAreas.includes(item.id);
            return (
                <button key={item.id} onClick={() => toggleFocus(item.id)} className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${isSelected ? 'bg-violet-900/20 border-violet-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[9px] font-bold uppercase whitespace-nowrap">{item.label}</span>
                </button>
            );
          })}
        </div>
      </Card>

      <Button variant="primary" onClick={handleSave} className="w-full py-4 flex items-center justify-center gap-2" disabled={loading}>
        {loading ? <RefreshCw className="animate-spin" size={18} /> : (saved ? <CheckCircle2 size={18} /> : <Save size={18} />)}
        {saved ? 'Changes Saved' : 'Save Changes'}
      </Button>

      <div className="border-t border-zinc-800 my-8" />

      {/* --- DECK MANAGER --- */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Manage Activity Deck</h2>
        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800 mb-4">
            {['low', 'medium', 'high'].map(i => (
                <button key={i} onClick={() => setDeckTab(i)} className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 transition-all ${deckTab === i ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {i === 'low' ? <Moon size={14}/> : i === 'medium' ? <Zap size={14}/> : <Flame size={14}/>}
                    <span className="text-[9px] font-black uppercase tracking-widest">{i}</span>
                </button>
            ))}
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Add New {deckTab} Card</h3>
            <div className="space-y-2">
                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-xs" placeholder="Title (e.g. Walk in Park)" value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} />
                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-xs" placeholder="Description (Optional)" value={newCardDesc} onChange={e => setNewCardDesc(e.target.value)} />
                <Button variant="accent" onClick={handleAddCard} className="w-full py-2 text-xs">Add to Deck</Button>
            </div>
        </div>
        <div className="space-y-2">
            {displayedCards.map(card => (
                <div key={card.id} className="flex justify-between items-start bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    <div><h4 className="text-sm font-bold text-white">{card.title}</h4><p className="text-[10px] text-zinc-500">{card.desc}</p></div>
                    <button onClick={() => onDeleteDeckCard(card)} className="text-zinc-600 hover:text-rose-500 p-2"><Trash2 size={16} /></button>
                </div>
            ))}
        </div>
      </div>

      <div className="border-t border-zinc-800 my-8" />
      <div className="space-y-4">
        <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest">System</h3>
        <button onClick={() => { if(window.confirm("Reset tokens to 0 and clear the vault?")) onResetEconomy(); }} className="w-full p-4 rounded-xl border border-rose-900/30 bg-rose-950/10 text-rose-400 text-sm font-bold flex items-center justify-between hover:bg-rose-950/20 transition-all"><span>Reset Economy</span><RotateCcw size={16} /></button>
        <button onClick={onLogout} className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 text-sm font-bold flex items-center justify-between hover:bg-zinc-800 transition-all"><span>Log Out</span><LogOut size={16} /></button>
      </div>
    </div>
  );
}