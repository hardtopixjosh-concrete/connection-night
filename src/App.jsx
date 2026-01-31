import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Sparkles, BookOpen, Settings } from 'lucide-react';
import { supabase } from './supabase'; 
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Play from './components/Play';
import Store from './components/Store';
import Journal from './components/Journal';
import Config from './components/Config';
import { FULL_DECK } from './data/gameData';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [realtimeStatus, setRealtimeStatus] = useState('CONNECTING');

  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [sharedState, setSharedState] = useState(null);
  const [history, setHistory] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [customStoreItems, setCustomStoreItems] = useState([]);
  const [customDeckCards, setCustomDeckCards] = useState([]);
  const [hiddenCards, setHiddenCards] = useState([]); 

  const activeDeck = [...FULL_DECK, ...customDeckCards].filter(c => !hiddenCards.includes(c.id));

  // 1. INITIAL SESSION CHECK
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData(session.user.id);
      else {
        setProfile(null);
        setPartnerProfile(null);
        setSharedState(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. REALTIME SUBSCRIPTIONS
  useEffect(() => {
    if (!profile?.couple_id) return;

    const coupleId = profile.couple_id;

    const stateChannel = supabase.channel('couple_state_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` }, (payload) => setSharedState(payload.new))
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

    const historyChannel = supabase.channel('history_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, () => fetchHistory()).subscribe();
    const voucherChannel = supabase.channel('voucher_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, () => fetchVouchers()).subscribe();
    
    const profileChannel = supabase.channel('profile_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `couple_id=eq.${coupleId}` }, (payload) => {
            if (payload.new.id === session.user.id) setProfile(payload.new);
            else setPartnerProfile(payload.new);
        })
        .subscribe();

    return () => { 
      supabase.removeAllChannels();
    };
  }, [profile?.couple_id]); 

  // 3. FETCH DATA
  async function fetchAllData(userId) {
    if (!userId) return;

    let { data: myProfile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    
    // If profile doesn't exist yet, stop here and let Auth component handle creation
    if (!myProfile) {
       setProfile(null);
       setLoading(false);
       return;
    }

    setProfile(myProfile);
    if (myProfile.hidden_card_ids) setHiddenCards(myProfile.hidden_card_ids);

    if (myProfile.couple_id) {
        let { data: coupleState } = await supabase.from('couples').select('*').eq('id', myProfile.couple_id).single();
        setSharedState(coupleState);

        let { data: pProfile } = await supabase.from('profiles').select('*').eq('couple_id', myProfile.couple_id).neq('id', userId).maybeSingle();
        setPartnerProfile(pProfile);
    }

    await Promise.all([
      fetchHistory(),
      fetchVouchers(),
      fetchCustomItems(),
      fetchCustomDeck()
    ]);
    setLoading(false);
  }

  const fetchHistory = async () => { const { data } = await supabase.from('history').select('*').order('created_at', { ascending: false }); setHistory(data || []); };
  const fetchVouchers = async () => { const { data } = await supabase.from('vouchers').select('*').eq('redeemed', false); setVouchers(data || []); };
  const fetchCustomItems = async () => { const { data } = await supabase.from('custom_store_items').select('*'); setCustomStoreItems(data || []); };
  const fetchCustomDeck = async () => { const { data } = await supabase.from('custom_deck_cards').select('*'); setCustomDeckCards(data || []); };

  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };

  const handleSignal = async (signalId) => {
    const col = profile.is_lead ? 'signal_a' : 'signal_b';
    const val = (profile.is_lead ? sharedState.signal_a : sharedState.signal_b) === signalId ? null : signalId;
    await supabase.from('couples').update({ [col]: val }).eq('id', profile.couple_id);
  };

  const handleSyncInput = async (inputs) => {
    const col = profile.is_lead ? 'sync_data_lead' : 'sync_data_partner';
    const updatedState = { ...sharedState, [col]: inputs, sync_stage: sharedState.sync_stage === 'idle' ? 'input' : sharedState.sync_stage };
    const leadData = profile.is_lead ? inputs : sharedState.sync_data_lead;
    const partnerData = !profile.is_lead ? inputs : sharedState.sync_data_partner;
    let newStage = updatedState.sync_stage;
    if (leadData && partnerData && updatedState.sync_stage === 'input') newStage = 'lead_picking';
    setSharedState({ ...updatedState, sync_stage: newStage });
    await supabase.from('couples').update({ [col]: inputs, sync_stage: newStage }).eq('id', profile.couple_id);
    if (newStage === 'input') setActiveTab('dashboard');
  };

  const handleLeadSelection = async (threeCards) => {
    setSharedState(prev => ({ ...prev, sync_pool: threeCards, sync_stage: 'partner_picking' }));
    await supabase.from('couples').update({ sync_pool: threeCards, sync_stage: 'partner_picking' }).eq('id', profile.couple_id);
  };

  const handleFinalSelection = async (finalCard) => {
     await supabase.from('history').insert([{ title: finalCard.title, intensity: finalCard.intensity, created_at: new Date().toISOString() }]);
     await supabase.from('couples').update({ sync_stage: 'active', sync_pool: [finalCard] }).eq('id', profile.couple_id);
     setActiveTab('dashboard');
  };
  
  const handleResetSync = async () => {
    await supabase.from('couples').update({ sync_stage: 'idle', sync_data_lead: null, sync_data_partner: null, sync_pool: null }).eq('id', profile.couple_id);
    setSharedState(prev => ({ ...prev, sync_stage: 'idle', sync_data_lead: null, sync_data_partner: null, sync_pool: null }));
  };

  const handleResetEconomy = async () => {
    await supabase.from('couples').update({ vault_current: 0 }).eq('id', profile.couple_id);
    await supabase.from('profiles').update({ tokens: 0 }).eq('id', session.user.id);
    if (partnerProfile) await supabase.from('profiles').update({ tokens: 0 }).eq('id', partnerProfile.id);
    setSharedState(prev => ({ ...prev, vault_current: 0 }));
  };

  const handleAddCustomItem = async (item) => { await supabase.from('custom_store_items').insert([item]); };
  const handleDeleteCustomItem = async (id) => { await supabase.from('custom_store_items').delete().eq('id', id); };
  
  const handlePurchase = async (item) => {
    if ((profile.tokens || 0) < item.cost) return; 
    await supabase.from('profiles').update({ tokens: (profile.tokens || 0) - item.cost }).eq('id', session.user.id);
    await supabase.from('vouchers').insert([{ label: item.label, icon_name: 'Ticket' }]);
  };

  const contributeToVault = async (amt) => {
    if ((profile.tokens || 0) < amt) return;
    await supabase.from('profiles').update({ tokens: (profile.tokens || 0) - amt }).eq('id', session.user.id);
    await supabase.from('couples').update({ vault_current: sharedState.vault_current + amt }).eq('id', profile.couple_id);
  };

  const handleAddDeckCard = async (card) => { await supabase.from('custom_deck_cards').insert([card]); };
  const handleDeleteDeckCard = async (card) => {
    if (card.id.length > 10) await supabase.from('custom_deck_cards').delete().eq('id', card.id);
    else {
        const newHidden = [...hiddenCards, card.id];
        setHiddenCards(newHidden);
        await supabase.from('profiles').update({ hidden_card_ids: newHidden }).eq('id', session.user.id);
    }
  };

  const handleOliveBranchClick = async () => {
    if (!sharedState) return;
    if (sharedState.olive_branch_accepted_at) {
      await supabase.from('couples').update({ olive_branch_accepted_at: null, olive_branch_active: false, olive_branch_sender: null }).eq('id', profile.couple_id);
    } else if (!sharedState.olive_branch_active) {
      await supabase.from('couples').update({ olive_branch_active: true, olive_branch_sender: session.user.id }).eq('id', profile.couple_id);
    } else if (sharedState.olive_branch_sender === session.user.id) {
      await supabase.from('couples').update({ olive_branch_active: false, olive_branch_sender: null }).eq('id', profile.couple_id);
    } else {
      await supabase.from('couples').update({ olive_branch_active: false, olive_branch_sender: null, olive_branch_accepted_at: new Date().toISOString() }).eq('id', profile.couple_id);
    }
  };

  const handleAddMemory = async (m) => { await supabase.from('history').insert([{ title: m.title, notes: m.desc, image_url: m.image, intensity: m.intensity, rating: m.rating }]); };
  const handleDeleteMemory = async (id) => { await supabase.from('history').delete().eq('id', id); };
  const handleUpdateMemory = async (id, u) => { await supabase.from('history').update(u).eq('id', id); };
  const handleUpdateProfile = async (u) => { await supabase.from('profiles').update(u).eq('id', session.user.id); setProfile(prev => ({ ...prev, ...u })); };

  // --- RENDER ---
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white"><Sparkles className="animate-spin" /></div>;

  // FIX IS HERE: We now correctly fetch the user ID before calling fetchAllData
  if (!session || !profile?.couple_id) {
    return (
      <Auth 
        onLoginSuccess={async () => {
          const { data } = await supabase.auth.getUser();
          if (data?.user) fetchAllData(data.user.id);
        }} 
      />
    );
  }

  const NavItem = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)} className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === id ? 'text-white scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
      <Icon size={24} fill={activeTab === id ? "currentColor" : "none"} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      {id === 'dashboard' && sharedState?.olive_branch_active && <span className="absolute -top-1 right-2 w-3 h-3 bg-rose-500 rounded-full border-2 border-zinc-950 animate-pulse" />}
    </button>
  );

  return (
    <div className="h-[100dvh] w-full bg-zinc-950 text-zinc-200 font-sans flex justify-center selection:bg-violet-500/30 overflow-hidden fixed inset-0">
      <div className="w-full max-w-md bg-zinc-950 h-full relative shadow-2xl flex flex-col overflow-hidden font-sans">
        <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 opacity-70 shrink-0" />
        
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide overscroll-contain pb-24">
          {activeTab === 'dashboard' && <Dashboard profile={profile} partnerProfile={partnerProfile} syncedConnection={sharedState?.sync_stage === 'active' ? { activity: sharedState.sync_pool[0], desc: 'Synced Plan Active' } : null} partnerSignal={profile.is_lead ? sharedState?.signal_b : sharedState?.signal_a} setPartnerSignal={() => handleSignal(profile.is_lead ? sharedState?.signal_b : sharedState?.signal_a)} onSignal={handleSignal} mySignal={profile.is_lead ? sharedState?.signal_a : sharedState?.signal_b} lastActivityDate={Date.now()} oliveBranchActive={sharedState?.olive_branch_active} oliveBranchSender={sharedState?.olive_branch_sender} oliveBranchAcceptedAt={sharedState?.olive_branch_accepted_at} onOliveBranchClick={handleOliveBranchClick} sessionUserId={session.user.id} syncStage={sharedState?.sync_stage} onNavigate={setActiveTab} />}
          {activeTab === 'play' && <Play profile={profile} deck={activeDeck} sharedState={sharedState} onSyncInput={handleSyncInput} onLeadSelection={handleLeadSelection} onFinalSelection={handleFinalSelection} onResetSync={handleResetSync} />}
          {activeTab === 'store' && <Store tokens={profile?.tokens || 0} onPurchase={handlePurchase} vault={{ current: sharedState?.vault_current || 0, goal: sharedState?.vault_goal || 50, name: sharedState?.vault_name || 'Goal' }} onContribute={contributeToVault} customItems={customStoreItems} onAddCustomItem={handleAddCustomItem} onDeleteCustomItem={handleDeleteCustomItem} />}
          {activeTab === 'memories' && <Journal profile={profile} history={history} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} onUpdateMemory={handleUpdateMemory} />}
          {activeTab === 'setup' && <Config profile={profile} onUpdateProfile={handleUpdateProfile} onLogout={handleLogout} onResetEconomy={handleResetEconomy} activeDeck={activeDeck} onAddDeckCard={handleAddDeckCard} onDeleteDeckCard={handleDeleteDeckCard} />}
        </div>
        
        <div className="w-full bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/50 pb-8 pt-2 px-6 shrink-0 z-50">
          <div className="flex justify-between items-center relative">
            <NavItem id="dashboard" label="Home" icon={Heart} />
            <NavItem id="store" label="Store" icon={ShoppingBag} />
            <div className="relative -top-8"><button onClick={() => setActiveTab('play')} className="h-16 w-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] border-[6px] border-zinc-950 active:scale-90 transition-all"><Sparkles size={28} fill="currentColor" /></button></div>
            <NavItem id="memories" label="History" icon={BookOpen} />
            <NavItem id="setup" label="Config" icon={Settings} />
          </div>
        </div>
      </div>
    </div>
  );
}