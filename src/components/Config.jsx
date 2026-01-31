import React, { useState } from 'react';
import { LogOut, Save, RotateCcw, CheckCircle2, Plus, Trash2, Layers, Moon, Zap, Flame } from 'lucide-react';
import { Card, Button } from './SharedUI';
import { MICRO_CONNECTIONS } from '../data/gameData';

export default function Config({ 
  profile, 
  onUpdateProfile, 
  onLogout, 
  onResetEconomy,
  activeDeck,
  onAddDeckCard,
  onDeleteDeckCard
}) {
  const [name, setName] = useState(profile.name);
  const [partnerName, setPartnerName] = useState(profile.partnerName);
  const [focusAreas, setFocusAreas] = useState(profile.partnerFocusAreas || []);
  const [saved, setSaved] = useState(false);
  
  // Deck Management State
  const [deckTab, setDeckTab] = useState('low'); // 'low', 'medium', 'high'
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');

  const handleSave = () => {
    onUpdateProfile({ name, partner_name: partnerName, partner_focus_areas: focusAreas });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  // Filter deck for current tab
  const displayedCards = activeDeck.filter(c => c.intensity === deckTab);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in">
      <div><h1 className="text-3xl font-bold text-white">Config</h1><p className="text-zinc-400 text-sm mt-1">Settings & Content.</p></div>

      {/* --- IDENTITY --- */}
      <Card title="Identity">
        <div className="space-y-4">
          <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Your Name</label><input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white mt-1 focus:border-violet-500 focus:outline-none" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Partner's Name</label><input className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white mt-1 focus:border-violet-500 focus:outline-none" value={partnerName} onChange={e => setPartnerName(e.target.value)} /></div>
        </div>
      </Card>

      <Card title="My Love Languages (Daily Drop)">
        <div className="grid grid-cols-2 gap-2">
          {MICRO_CONNECTIONS.map(item => {
            const isSelected = focusAreas.includes(item.id);
            return (<button key={item.id} onClick={() => toggleFocus(item.id)} className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${isSelected ? 'bg-violet-900/20 border-violet-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}><span>{item.label}</span>{isSelected && <CheckCircle2 size={12} className="text-violet-500" />}</button>);
          })}
        </div>
      </Card>

      <Button variant="primary" onClick={handleSave} className="w-full py-4 flex items-center justify-center gap-2">{saved ? <CheckCircle2 size={18} /> : <Save size={18} />}{saved ? 'Changes Saved' : 'Save Changes'}</Button>

      <div className="border-t border-zinc-800 my-8" />

      {/* --- DECK MANAGER --- */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Manage Activity Deck</h2>
        
        {/* Intensity Tabs */}
        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800 mb-4">
            {['low', 'medium', 'high'].map(i => (
                <button key={i} onClick={() => setDeckTab(i)} className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 transition-all ${deckTab === i ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {i === 'low' ? <Moon size={14}/> : i === 'medium' ? <Zap size={14}/> : <Flame size={14}/>}
                    <span className="text-[9px] font-black uppercase tracking-widest">{i}</span>
                </button>
            ))}
        </div>

        {/* Add Card Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Add New {deckTab} Card</h3>
            <div className="space-y-2">
                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-xs" placeholder="Title (e.g. Walk in Park)" value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} />
                <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-xs" placeholder="Description (Optional)" value={newCardDesc} onChange={e => setNewCardDesc(e.target.value)} />
                <Button variant="accent" onClick={handleAddCard} className="w-full py-2 text-xs">Add to Deck</Button>
            </div>
        </div>

        {/* Card List */}
        <div className="space-y-2">
            {displayedCards.map(card => (
                <div key={card.id} className="flex justify-between items-start bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                    <div>
                        <h4 className="text-sm font-bold text-white">{card.title}</h4>
                        <p className="text-[10px] text-zinc-500">{card.desc}</p>
                    </div>
                    <button onClick={() => onDeleteDeckCard(card)} className="text-zinc-600 hover:text-rose-500 p-2"><Trash2 size={16} /></button>
                </div>
            ))}
        </div>
      </div>

      <div className="border-t border-zinc-800 my-8" />

      {/* --- DANGER ZONE --- */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest">System</h3>
        <button onClick={() => { if(window.confirm("Reset tokens to 0 and clear the vault?")) onResetEconomy(); }} className="w-full p-4 rounded-xl border border-rose-900/30 bg-rose-950/10 text-rose-400 text-sm font-bold flex items-center justify-between hover:bg-rose-950/20 transition-all"><span>Reset Economy</span><RotateCcw size={16} /></button>
        <button onClick={onLogout} className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 text-sm font-bold flex items-center justify-between hover:bg-zinc-800 transition-all"><span>Log Out</span><LogOut size={16} /></button>
      </div>
    </div>
  );
}