import React, { useState } from 'react';
import { ShoppingBag, Lock, Plus, Ticket, Star, Trash2, Coins } from 'lucide-react';
import { Card, Button } from './SharedUI';
import { STORE_ITEMS } from '../data/gameData';

export default function Store({ 
  tokens, 
  onPurchase, 
  vault, 
  onContribute, 
  customItems = [], 
  onAddCustomItem, 
  onDeleteCustomItem 
}) {
  const [contribution, setContribution] = useState(1);
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'manage'
  
  // Custom Item Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState(5);

  const handleContribute = () => {
    if (tokens >= contribution && contribution > 0) {
      onContribute(contribution);
      setContribution(1);
    }
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;
    onAddCustomItem({ label: newItemName, cost: parseInt(newItemCost) });
    setNewItemName('');
    setNewItemCost(5);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      {/* HEADER */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">The Store</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400">{tokens}</span>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Tokens</span>
          </div>
        </div>
        <div className="bg-zinc-800 p-3 rounded-full"><ShoppingBag size={24} className="text-zinc-400" /></div>
      </div>

      {/* TOGGLE TABS */}
      <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
        <button onClick={() => setActiveTab('buy')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'buy' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Purchase</button>
        <button onClick={() => setActiveTab('manage')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'manage' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Manage Items</button>
      </div>

      {activeTab === 'buy' ? (
        <div className="space-y-6">
          {/* VAULT */}
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900 border-amber-900/30">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-white font-bold text-lg uppercase tracking-wide">Shared Vault</h3><p className="text-amber-500/60 text-xs font-mono uppercase">Goal: {vault.name}</p></div>
              <Lock size={20} className="text-amber-600" />
            </div>
            <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden mb-4"><div className="h-full bg-amber-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(245,158,11,0.5)]" style={{ width: `${(vault.current / vault.goal) * 100}%` }} /></div>
            <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6"><span>{vault.current} Saved</span><span>{vault.goal} Target</span></div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-zinc-950 rounded-xl border border-zinc-800 px-3"><span className="text-zinc-500 font-bold text-xs mr-2">AMT</span><input type="number" min="1" max={tokens} value={contribution} onChange={(e) => setContribution(parseInt(e.target.value) || 0)} className="w-full bg-transparent text-white font-bold focus:outline-none" /></div>
              <Button disabled={tokens < contribution || contribution <= 0} onClick={handleContribute} className="px-6 bg-amber-600 hover:bg-amber-500 text-white">Deposit</Button>
            </div>
          </Card>

          {/* STORE ITEMS */}
          <div className="space-y-3">
            {[...STORE_ITEMS, ...customItems].map(item => (
              <button key={item.id} onClick={() => onPurchase(item)} disabled={tokens < item.cost} className="w-full flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 disabled:opacity-50 disabled:hover:border-zinc-800 transition-all group text-left">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${tokens >= item.cost ? 'bg-zinc-800 text-white group-hover:scale-110' : 'bg-zinc-950 text-zinc-600'} transition-transform`}>
                    {item.icon ? <item.icon size={20} /> : <Ticket size={20} />}
                  </div>
                  <div><h4 className={`font-bold text-sm ${tokens >= item.cost ? 'text-white' : 'text-zinc-500'}`}>{item.label}</h4><p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.desc || 'Custom Reward'}</p></div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-black ${tokens >= item.cost ? 'bg-white text-black' : 'bg-zinc-950 text-zinc-600'}`}>{item.cost}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card title="Add Custom Reward">
             <div className="flex gap-2">
                <input className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs focus:border-violet-500 focus:outline-none" placeholder="Reward Name (e.g. Back Rub)" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                <input className="w-16 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-xs text-center focus:border-violet-500 focus:outline-none" type="number" min="1" value={newItemCost} onChange={e => setNewItemCost(e.target.value)} />
                <button onClick={handleAddItem} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-colors"><Plus size={18} /></button>
             </div>
          </Card>

          <div className="space-y-2">
             <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">Your Custom Items</h3>
             {customItems.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                   <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-white">{item.label}</span>
                      <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-400 flex items-center gap-1"><Coins size={10} /> {item.cost}</span>
                   </div>
                   <button onClick={() => onDeleteCustomItem(item.id)} className="text-zinc-600 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                </div>
             ))}
             {customItems.length === 0 && <div className="text-center text-zinc-600 text-xs italic py-4">No custom items added yet.</div>}
          </div>
        </div>
      )}
    </div>
  );
}