import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Sparkles, BookOpen, Settings, Delete } from 'lucide-react';
import { supabase } from './supabase'; 
import Dashboard from './components/Dashboard';
import Play from './components/Play';
import Store from './components/Store';
import Journal from './components/Journal';
import Config from './components/Config';
import { FULL_DECK } from './data/gameData';

const PIN_MAP = {
  '6789': '67896789-6789-6789-6789-678967896789', // Josh (Lead)
  '1234': '12341234-1234-1234-1234-123412341234', // Kara (Partner)
  '1111': '11111111-1111-1111-1111-111111111111'  // Test
};

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('CONNECTING');

  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [sharedState, setSharedState] = useState(null);
  const [history, setHistory] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [customStoreItems, setCustomStoreItems] = useState([]);
  
  // DECK STATE: Default + Custom
  const [customDeckCards, setCustomDeckCards] = useState([]);
  const [hiddenCards, setHiddenCards] = useState([]); 

  // Computed Deck: Full Deck + Custom - Hidden
  const activeDeck = [...FULL_DECK, ...customDeckCards].filter(c => !hiddenCards.includes(c.id));

  useEffect(() => {
    const savedId = localStorage.getItem('velvet_user_id');
    if (savedId) { setSessionUser(savedId); fetchAllData(savedId); }
  }, []);

  useEffect(() => {
    if (!sessionUser) return;

    // Calculate partner ID here so we don't need partnerProfile as a dependency
    const partnerId = (sessionUser === PIN_MAP['6789']) ? PIN_MAP['1234'] : PIN_MAP['6789'];

    // --- REALTIME SUBSCRIPTIONS ---
    const stateChannel = supabase.channel('couple_state_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_state' }, (payload) => setSharedState(payload.new))
      .subscribe((status) => setRealtimeStatus(status));

    const deckChannel = supabase.channel('deck_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_deck_cards' }, (payload) => {
        if (payload.eventType === 'INSERT') setCustomDeckCards(prev => [...prev, payload.new]);
        if (payload.eventType === 'DELETE') setCustomDeckCards(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .subscribe();

    const itemsChannel = supabase.channel('items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_store_items' }, (payload) => {
        if (payload.eventType === 'INSERT') setCustomStoreItems(prev => [...prev, payload.new]);
        if (payload.eventType === 'DELETE') setCustomStoreItems(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();

    // Re-fetch history/vouchers on changes
    const historyChannel = supabase.channel('history_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, () => fetchHistory()).subscribe();
    const voucherChannel = supabase.channel('voucher_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, () => fetchVouchers()).subscribe();
    
    // Listen for Profile changes (balance updates)
    const profileChannel = supabase.channel('profile_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
            if (payload.new.id === sessionUser) setProfile(payload.new);
            // Use the calculated partnerId so we don't rely on the state variable
            if (payload.new.id === partnerId) setPartnerProfile(payload.new);
        })
        .subscribe();

    return () => { 
      supabase.removeAllChannels();
    };
  }, [sessionUser]); 

  async function fetchAllData(userId) {
    setLoading(true);
    await Promise.all([
      fetchProfiles(userId),
      fetchState(),
      fetchHistory(),
      fetchVouchers(),
      fetchCustomItems(),
      fetchCustomDeck()
    ]);
    setLoading(false);
  }

  // --- FETCHERS ---
  const fetchProfiles = async (userId) => {
      let { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!data) {
         const isJosh = (userId === PIN_MAP['6789']);
         const newProfile = { id: userId, name: isJosh ? 'Josh' : 'Kara', partner_name: isJosh ? 'Kara' : 'Josh', is_lead: isJosh, partner_focus_areas: ['hugs'], tokens: 0 };
         await supabase.from('profiles').insert([newProfile]);
         data = newProfile;
      }
      setProfile(data);
      if (data.hidden_card_ids) setHiddenCards(data.hidden_card_ids);

      const partnerId = (userId === PIN_MAP['6789']) ? PIN_MAP['1234'] : PIN_MAP['6789'];
      let { data: pData } = await supabase.from('profiles').select('*').eq('id', partnerId).maybeSingle();
      setPartnerProfile(pData);
  };

  const fetchState = async () => {
      let { data } = await supabase.from('couple_state').select('*').eq('id', 1).maybeSingle();
      if (!data) { const { data: newData } = await supabase.from('couple_state').insert([{ id: 1, vault_current: 0 }]).select().single(); setSharedState(newData); } 
      else { setSharedState(data); }
  };
  const fetchHistory = async () => { const { data } = await supabase.from('history').select('*').order('created_at', { ascending: false }); setHistory(data || []); };
  const fetchVouchers = async () => { const { data } = await supabase.from('vouchers').select('*').eq('redeemed', false); setVouchers(data || []); };
  const fetchCustomItems = async () => { const { data } = await supabase.from('custom_store_items').select('*'); setCustomStoreItems(data || []); };
  const fetchCustomDeck = async () => { const { data } = await supabase.from('custom_deck_cards').select('*'); setCustomDeckCards(data || []); };

  // --- HANDLERS ---
  const handlePinLogin = (enteredPin) => {
    if (enteredPin.length < 4) return;
    const matchedUserId = PIN_MAP[enteredPin];
    if (matchedUserId) { localStorage.setItem('velvet_user_id', matchedUserId); setSessionUser(matchedUserId); fetchAllData(matchedUserId); setPin(''); } 
    else { setErrorMsg('Invalid Access Code'); setPin(''); }
  };
  const handlePadClick = (num) => { if (pin.length < 4) { const newPin = pin + num; setPin(newPin); if (newPin.length === 4) handlePinLogin(newPin); }};
  const handleBackspace = () => { setPin(prev => prev.slice(0, -1)); setErrorMsg(''); };
  const handleLogout = () => { localStorage.removeItem('velvet_user_id'); setSessionUser(null); setProfile(null); setSharedState(null); setPin(''); };

  const handleSignal = async (signalId) => {
    const isAlex = sessionUser === PIN_MAP['6789'];
    const column = isAlex ? 'signal_a' : 'signal_b';
    const currentSignal = isAlex ? sharedState.signal_a : sharedState.signal_b;
    const newSignal = (currentSignal === signalId) ? null : signalId;
    await supabase.from('couple_state').update({ [column]: newSignal }).eq('id', 1);
  };

  const handleSyncInput = async (inputs) => {
    const isLead = profile.is_lead;
    const column = isLead ? 'sync_data_lead' : 'sync_data_partner';
    const updatedState = { ...sharedState, [column]: inputs, sync_stage: sharedState.sync_stage === 'idle' ? 'input' : sharedState.sync_stage };
    const leadData = isLead ? inputs : sharedState.sync_data_lead;
    const partnerData = !isLead ? inputs : sharedState.sync_data_partner;
    let newStage = updatedState.sync_stage;
    if (leadData && partnerData && updatedState.sync_stage === 'input') newStage = 'lead_picking';
    setSharedState({ ...updatedState, sync_stage: newStage });
    await supabase.from('couple_state').update({ [column]: inputs, sync_stage: newStage }).eq('id', 1);
    if (newStage === 'input') setActiveTab('dashboard');
  };

  const handleLeadSelection = async (threeCards) => {
    setSharedState(prev => ({ ...prev, sync_pool: threeCards, sync_stage: 'partner_picking' }));
    await supabase.from('couple_state').update({ sync_pool: threeCards, sync_stage: 'partner_picking' }).eq('id', 1);
  };

  const handleFinalSelection = async (finalCard) => {
     // 1. Log History
     const historyItem = { title: finalCard.title, intensity: finalCard.intensity, created_at: new Date().toISOString() };
     await supabase.from('history').insert([historyItem]);

     // 2. COMPROMISE LOGIC - ROBUST CHECK
     try {
       // Fetch fresh inputs to be 100% sure
       const { data: freshState } = await supabase.from('couple_state').select('*').eq('id', 1).single();
       
       if (freshState && freshState.sync_data_lead && freshState.sync_data_partner) {
           const intensityMap = { 'low': 1, 'medium': 2, 'high': 3 };
           
           // Clean inputs to avoid "High" vs "high" mismatch
           const leadRaw = freshState.sync_data_lead.intensity || 'low';
           const partnerRaw = freshState.sync_data_partner.intensity || 'low';
           
           const leadVal = intensityMap[leadRaw.toLowerCase()] || 1;
           const partnerVal = intensityMap[partnerRaw.toLowerCase()] || 1;

           let recipientId = null;

           if (leadVal > partnerVal) {
               recipientId = PIN_MAP['6789']; // Josh
           } else if (partnerVal > leadVal) {
               recipientId = PIN_MAP['1234']; // Kara
           }

           if (recipientId) {
               const { data: userData } = await supabase.from('profiles').select('tokens').eq('id', recipientId).single();
               const currentTokens = userData?.tokens || 0;
               await supabase.from('profiles').update({ tokens: currentTokens + 1 }).eq('id', recipientId);
               
               // Force refresh profile data for both users locally
               fetchProfiles(sessionUser);
           }
       }
     } catch (err) {
       console.error("Token Error:", err);
     }

     // 3. Update Shared State
     await supabase.from('couple_state').update({ sync_stage: 'active', sync_pool: [finalCard] }).eq('id', 1);
     setActiveTab('dashboard');
  };
  
  const handleResetSync = async () => {
    await supabase.from('couple_state').update({ sync_stage: 'idle', sync_data_lead: null, sync_data_partner: null, sync_pool: null }).eq('id', 1);
    setSharedState(prev => ({ ...prev, sync_stage: 'idle', sync_data_lead: null, sync_data_partner: null, sync_pool: null }));
  };

  const handleResetEconomy = async () => {
    // Reset Shared Vault
    await supabase.from('couple_state').update({ vault_current: 0 }).eq('id', 1);
    // Reset My Tokens
    await supabase.from('profiles').update({ tokens: 0 }).eq('id', sessionUser);
    // Reset Partner Tokens
    if (partnerProfile) {
        await supabase.from('profiles').update({ tokens: 0 }).eq('id', partnerProfile.id);
    }
    setSharedState(prev => ({ ...prev, vault_current: 0 }));
  };

  const handleAddCustomItem = async (item) => { await supabase.from('custom_store_items').insert([item]); };
  const handleDeleteCustomItem = async (id) => { await supabase.from('custom_store_items').delete().eq('id', id); };
  
  const handlePurchase = async (item) => {
    const currentTokens = profile.tokens || 0;
    if (currentTokens < item.cost) return; // Frontend check

    // Deduct from My Personal Profile
    await supabase.from('profiles').update({ tokens: currentTokens - item.cost }).eq('id', sessionUser);
    await supabase.from('vouchers').insert([{ label: item.label, icon_name: 'Ticket' }]);
  };

  const contributeToVault = async (amt) => {
    const currentTokens = profile.tokens || 0;
    if (currentTokens < amt) return;

    // Deduct from Me, Add to Shared Vault
    await supabase.from('profiles').update({ tokens: currentTokens - amt }).eq('id', sessionUser);
    await supabase.from('couple_state').update({ vault_current: sharedState.vault_current + amt }).eq('id', 1);
  };

  const handleAddDeckCard = async (card) => {
    await supabase.from('custom_deck_cards').insert([card]);
  };

  const handleDeleteDeckCard = async (card) => {
    if (card.id.length > 10) { 
        await supabase.from('custom_deck_cards').delete().eq('id', card.id);
    } else {
        const newHidden = [...hiddenCards, card.id];
        setHiddenCards(newHidden);
        await supabase.from('profiles').update({ hidden_card_ids: newHidden }).eq('id', sessionUser);
    }
  };

  const handleOliveBranchClick = async () => {
    if (!sharedState) return;
    if (sharedState.olive_branch_accepted_at) {
      setSharedState(prev => ({ ...prev, olive_branch_accepted_at: null, olive_branch_active: false, olive_branch_sender: null }));
      await supabase.from('couple_state').update({ olive_branch_accepted_at: null, olive_branch_active: false, olive_branch_sender: null }).eq('id', 1);
      return;
    }
    if (!sharedState.olive_branch_active) {
      await supabase.from('couple_state').update({ olive_branch_active: true, olive_branch_sender: sessionUser }).eq('id', 1);
      return;
    }
    if (sharedState.olive_branch_sender === sessionUser) {
      await supabase.from('couple_state').update({ olive_branch_active: false, olive_branch_sender: null }).eq('id', 1);
      return;
    }
    if (sharedState.olive_branch_sender !== sessionUser) {
      const nowTime = new Date().toISOString();
      await supabase.from('couple_state').update({ olive_branch_active: false, olive_branch_sender: null, olive_branch_accepted_at: nowTime }).eq('id', 1);
    }
  };

  const handleAddMemory = async (memoryData) => {
    const newMem = { title: memoryData.title, notes: memoryData.desc, image_url: memoryData.image, intensity: memoryData.intensity, rating: memoryData.rating };
    await supabase.from('history').insert([newMem]);
  };

  const handleDeleteMemory = async (id) => { await supabase.from('history').delete().eq('id', id); };
  const handleUpdateMemory = async (id, updates) => { await supabase.from('history').update(updates).eq('id', id); };
  const handleUpdateProfile = async (updates) => { await supabase.from('profiles').update(updates).eq('id', sessionUser); setProfile(prev => ({ ...prev, ...updates })); };

  const NavItem = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)} className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === id ? 'text-white scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
      <Icon size={24} fill={activeTab === id ? "currentColor" : "none"} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      {id === 'dashboard' && sharedState?.signal_a && sessionUser !== PIN_MAP['6789'] && <span className="absolute -top-1 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-zinc-950 animate-pulse" />}
      {id === 'dashboard' && sharedState?.signal_b && sessionUser === PIN_MAP['6789'] && <span className="absolute -top-1 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-zinc-950 animate-pulse" />}
    </button>
  );

  if (!sessionUser) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none">
      <Sparkles size={48} className="text-violet-500 mb-8 animate-pulse" /><h1 className="text-2xl font-bold text-white mb-8 tracking-widest uppercase">Enter Access Code</h1>
      <div className="flex gap-4 mb-10">{[0, 1, 2, 3].map(i => (<div key={i} className={`w-4 h-4 rounded-full border border-zinc-700 transition-all ${pin.length > i ? 'bg-violet-500 border-violet-500 scale-125' : 'bg-transparent'}`} />))}</div>
      {errorMsg && <div className="text-rose-500 text-sm font-bold mb-6 animate-bounce">{errorMsg}</div>}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (<button key={num} onClick={() => handlePadClick(num.toString())} className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 text-2xl font-bold text-white hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all">{num}</button>))}
        <div /><button onClick={() => handlePadClick('0')} className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 text-2xl font-bold text-white hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all">0</button><button onClick={handleBackspace} className="w-20 h-20 rounded-full bg-transparent text-zinc-500 flex items-center justify-center hover:text-white active:scale-95 transition-all"><Delete size={28} /></button>
      </div>
    </div>
  );

  const uiProfile = { name: profile?.name || 'User', partnerName: profile?.partner_name || 'Partner', partnerFocusAreas: profile?.partner_focus_areas || [], isUserLead: profile?.is_lead };
  const isAlex = sessionUser === PIN_MAP['6789'];
  const myCurrentSignal = isAlex ? sharedState?.signal_a : sharedState?.signal_b;
  const partnerCurrentSignal = isAlex ? sharedState?.signal_b : sharedState?.signal_a;

  return (
    <div className="h-[100dvh] w-full bg-zinc-950 text-zinc-200 font-sans flex justify-center selection:bg-violet-500/30 overflow-hidden fixed inset-0">
      <div className="w-full max-w-md bg-zinc-950 h-full relative shadow-2xl flex flex-col overflow-hidden font-sans">
        <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 opacity-70 shrink-0" />
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide overscroll-contain pb-24">
          {activeTab === 'dashboard' && <Dashboard profile={uiProfile} partnerProfile={partnerProfile} syncedConnection={sharedState?.sync_stage === 'active' ? { activity: sharedState.sync_pool[0], desc: 'Synced Plan Active' } : null} partnerSignal={partnerCurrentSignal} setPartnerSignal={() => handleSignal(partnerCurrentSignal)} onSignal={handleSignal} mySignal={myCurrentSignal} lastActivityDate={Date.now()} vouchers={vouchers} onFulfillVoucher={() => {}} oliveBranchActive={sharedState?.olive_branch_active} oliveBranchSender={sharedState?.olive_branch_sender} oliveBranchAcceptedAt={sharedState?.olive_branch_accepted_at} onOliveBranchClick={handleOliveBranchClick} sessionUserId={sessionUser} syncStage={sharedState?.sync_stage} onNavigate={setActiveTab} />}
          {activeTab === 'play' && <Play profile={uiProfile} deck={activeDeck} sharedState={sharedState} onSyncInput={handleSyncInput} onLeadSelection={handleLeadSelection} onFinalSelection={handleFinalSelection} onResetSync={handleResetSync} />}
          {activeTab === 'store' && <Store tokens={profile?.tokens || 0} onPurchase={handlePurchase} vault={{ current: sharedState?.vault_current || 0, goal: sharedState?.vault_goal || 50, name: sharedState?.vault_name || 'Goal' }} onContribute={contributeToVault} customItems={customStoreItems} onAddCustomItem={handleAddCustomItem} onDeleteCustomItem={handleDeleteCustomItem} />}
          {activeTab === 'memories' && <Journal profile={uiProfile} history={history} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} onUpdateMemory={handleUpdateMemory} />}
          {activeTab === 'setup' && <Config profile={uiProfile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} onResetEconomy={handleResetEconomy} activeDeck={activeDeck} onAddDeckCard={handleAddDeckCard} onDeleteDeckCard={handleDeleteDeckCard} />}
        </div>
        
        {/* Fixed Navigation Bar */}
        <div className="w-full bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 pb-8 pt-2 px-6 shrink-0 z-50">
          <div className="flex justify-between items-center relative">
            <NavItem id="dashboard" label="Home" icon={Heart} />
            <NavItem id="store" label="Store" icon={ShoppingBag} />
            <div className="relative -top-8"><button onClick={() => setActiveTab('play')} className="h-16 w-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] border-[6px] border-zinc-950 active:scale-90 transition-all"><Sparkles size={28} fill="currentColor" /></button></div>
            <NavItem id="memories" label="History" icon={BookOpen} />
            <NavItem id="setup" label="Config" icon={Settings} />
          </div>
        </div>
        <div className={`fixed bottom-2 right-2 w-2 h-2 rounded-full z-50 pointer-events-none ${realtimeStatus === 'SUBSCRIBED' ? 'bg-emerald-500' : 'bg-rose-500'}`} title={realtimeStatus} />
      </div>
    </div>
  );
}