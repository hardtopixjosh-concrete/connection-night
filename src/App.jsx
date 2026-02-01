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
  
  const [profile, setProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [sharedState, setSharedState] = useState(null);
  const [history, setHistory] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [customStoreItems, setCustomStoreItems] = useState([]);
  const [customDeckCards, setCustomDeckCards] = useState([]);
  const [hiddenCards, setHiddenCards] = useState([]); 

  const activeDeck = [...FULL_DECK, ...customDeckCards].filter(c => !hiddenCards.includes(String(c.id)));

  // 1. INITIAL SESSION
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

  // 2. REALTIME
  useEffect(() => {
    if (!profile?.couple_id) {
        supabase.removeAllChannels(); 
        return;
    }

    const coupleId = profile.couple_id;

    const stateChannel = supabase.channel('couple_state_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` }, (payload) => {
          if (payload.new) setSharedState(payload.new);
      })
      .subscribe();

    const profileChannel = supabase.channel('profile_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `couple_id=eq.${coupleId}` }, (payload) => {
            if (session?.user?.id) fetchAllData(session.user.id);
        })
        .subscribe();
    
    supabase.channel('history_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'history', filter: `couple_id=eq.${coupleId}` }, () => fetchHistory(coupleId))
        .subscribe();

    supabase.channel('deck_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_deck_cards', filter: `couple_id=eq.${coupleId}` }, () => fetchCustomDeck(coupleId))
        .subscribe();

    supabase.channel('items_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_store_items', filter: `couple_id=eq.${coupleId}` }, () => fetchCustomItems(coupleId))
        .subscribe();

    supabase.channel('voucher_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, () => fetchVouchers()).subscribe();
    
    return () => supabase.removeAllChannels();
  }, [profile?.couple_id]); 

  // 3. FETCH DATA
  async function fetchAllData(userId) {
    if (!userId) return;
    let { data: myProfile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    
    if (!myProfile) {
        setProfile({ id: userId, couple_id: null, name: 'User', isUserLead: false });
        setLoading(false);
        return;
    }

    let coupleState = null;
    let pProfile = null;

    if (myProfile.couple_id) {
        let { data: c } = await supabase.from('couples').select('*').eq('id', myProfile.couple_id).single();
        coupleState = c;
        let { data: p } = await supabase.from('profiles').select('*').eq('couple_id', myProfile.couple_id).neq('id', userId).maybeSingle();
        pProfile = p;
    }

    const formattedProfile = {
        ...myProfile,
        isUserLead: myProfile.is_lead,
        partnerName: pProfile ? pProfile.name : 'Partner'
    };

    setProfile(formattedProfile);
    if (myProfile.hidden_card_ids) setHiddenCards(myProfile.hidden_card_ids);
    setSharedState(coupleState);
    setPartnerProfile(pProfile);

    await Promise.all([
        myProfile.couple_id ? fetchHistory(myProfile.couple_id) : Promise.resolve(),
        myProfile.couple_id ? fetchCustomDeck(myProfile.couple_id) : Promise.resolve(),
        myProfile.couple_id ? fetchCustomItems(myProfile.couple_id) : Promise.resolve(),
        fetchVouchers()
    ]);
    setLoading(false);
  }

  // --- ACTIONS ---
  
  const fetchHistory = async (targetCoupleId) => { 
    if (!targetCoupleId) return;
    const { data } = await supabase.from('history').select('*').eq('couple_id', targetCoupleId).order('created_at', { ascending: false }); 
    setHistory(data || []); 
  };

  const fetchVouchers = async () => { const { data } = await supabase.from('vouchers').select('*').eq('redeemed', false); setVouchers(data || []); };
  
  const fetchCustomItems = async (targetCoupleId) => { 
      const cId = targetCoupleId || profile?.couple_id;
      if (!cId) return;
      const { data } = await supabase.from('custom_store_items').select('*').eq('couple_id', cId); 
      setCustomStoreItems(data || []); 
  };
  
  const fetchCustomDeck = async (targetCoupleId) => { 
      const cId = targetCoupleId || profile?.couple_id;
      if (!cId) return;
      const { data } = await supabase.from('custom_deck_cards').select('*').eq('couple_id', cId);
      const mappedCards = (data || []).map(c => ({ ...c, desc: c.desc_text }));
      setCustomDeckCards(mappedCards); 
  };

  const handleCreateLink = async () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const { data: couple } = await supabase.from('couples').insert([{ link_code: code }]).select().single();
    await supabase.from('profiles').update({ couple_id: couple.id, is_lead: true }).eq('id', session.user.id);
    await fetchAllData(session.user.id);
    return code;
  };

  const handleJoinLink = async (code) => {
    setLoading(true);
    try {
        const cleanCode = code.trim().toUpperCase();
        const { data: couple, error } = await supabase.from('couples').select('id').eq('link_code', cleanCode).maybeSingle();
        if (error) throw new Error("Database Error: " + error.message);
        if (!couple) throw new Error("Invalid Code: No partner found.");
        const { error: updateError } = await supabase.from('profiles').update({ couple_id: couple.id, is_lead: false }).eq('id', session.user.id);
        if (updateError) throw new Error("Could not join: " + updateError.message);
        await fetchAllData(session.user.id); 
        setActiveTab('dashboard');
    } catch (e) {
        alert(e.message); 
    } finally {
        setLoading(false); 
    }
  };

  const handleUnlink = async () => {
    const { error } = await supabase.rpc('disconnect_partner');
    if (error) console.error("Unlink failed:", error);
    setProfile(prev => ({ ...prev, couple_id: null }));
    setPartnerProfile(null);
    setSharedState(null);
    await fetchAllData(session.user.id);
  };
  
  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };

  const handleSignal = async (signalId) => {
    if (!profile?.couple_id) return;
    const col = profile.isUserLead ? 'signal_a' : 'signal_b';
    const val = (profile.isUserLead ? sharedState.signal_a : sharedState.signal_b) === signalId ? null : signalId;
    setSharedState(prev => ({ ...prev, [col]: val }));
    await supabase.from('couples').update({ [col]: val }).eq('id', profile.couple_id);
  };

  const handleOliveBranchClick = async () => {
    if (!sharedState) return;
    let updates = {};
    if (sharedState.olive_branch_accepted_at) {
      updates = { olive_branch_accepted_at: null, olive_branch_active: false, olive_branch_sender: null };
    } else if (!sharedState.olive_branch_active) {
      updates = { olive_branch_active: true, olive_branch_sender: session.user.id };
    } else if (sharedState.olive_branch_sender === session.user.id) {
      updates = { olive_branch_active: false, olive_branch_sender: null };
    } else {
      updates = { olive_branch_active: false, olive_branch_sender: null, olive_branch_accepted_at: new Date().toISOString() };
    }
    setSharedState(prev => ({ ...prev, ...updates }));
    await supabase.from('couples').update(updates).eq('id', profile.couple_id);
  };

  const handleSyncInput = async (inputs) => {
    setActiveTab('dashboard');
    const col = profile.isUserLead ? 'sync_data_lead' : 'sync_data_partner';
    setSharedState(prev => ({ ...prev, [col]: inputs, sync_stage: prev.sync_stage === 'idle' ? 'input' : prev.sync_stage }));
    await supabase.from('couples').update({ [col]: inputs, sync_stage: 'input' }).eq('id', profile.couple_id);
    
    const leadData = profile.isUserLead ? inputs : sharedState.sync_data_lead;
    const partnerData = !profile.isUserLead ? inputs : sharedState.sync_data_partner;
    
    if (leadData && partnerData) {
        setSharedState(prev => ({ ...prev, sync_stage: 'lead_picking' }));
        await supabase.from('couples').update({ sync_stage: 'lead_picking' }).eq('id', profile.couple_id);
    }
  };

  const handleLeadSelection = async (threeCards) => {
    setActiveTab('dashboard');
    setSharedState(prev => ({ ...prev, sync_pool: threeCards, sync_stage: 'partner_picking' }));
    await supabase.from('couples').update({ sync_pool: threeCards, sync_stage: 'partner_picking' }).eq('id', profile.couple_id);
  };

  const handleFinalSelection = async (finalCard) => {
     setActiveTab('dashboard');
     setSharedState(prev => ({ ...prev, sync_stage: 'active', sync_pool: [finalCard] }));
     
     const getInt = (val) => {
         if (val === 'high' || val === 3) return 3;
         if (val === 'medium' || val === 2) return 2;
         return 1;
     };

     const leadReq = getInt(sharedState.sync_data_lead?.intensity);
     const partnerReq = getInt(sharedState.sync_data_partner?.intensity);
     const finalInt = getInt(finalCard.intensity);

     if (leadReq > finalInt) {
         const leadId = profile.isUserLead ? profile.id : partnerProfile?.id;
         if (leadId) {
             const currentTokens = (profile.isUserLead ? profile.tokens : partnerProfile?.tokens) || 0;
             await supabase.from('profiles').update({ tokens: currentTokens + 1 }).eq('id', leadId);
             if (profile.isUserLead) setProfile(prev => ({ ...prev, tokens: (prev.tokens || 0) + 1 }));
         }
     }

     if (partnerReq > finalInt) {
         const partnerId = !profile.isUserLead ? profile.id : partnerProfile?.id;
         if (partnerId) {
             const currentTokens = (!profile.isUserLead ? profile.tokens : partnerProfile?.tokens) || 0;
             await supabase.from('profiles').update({ tokens: currentTokens + 1 }).eq('id', partnerId);
             if (!profile.isUserLead) setProfile(prev => ({ ...prev, tokens: (prev.tokens || 0) + 1 }));
         }
     }

     await supabase.from('history').insert([{ 
         title: finalCard.title, 
         intensity: finalCard.intensity, 
         couple_id: profile.couple_id,
         created_at: new Date().toISOString() 
     }]);

     await supabase.from('couples').update({ sync_stage: 'active', sync_pool: [finalCard] }).eq('id', profile.couple_id);

     if (partnerProfile) {
         const myNewRole = !profile.isUserLead;
         const partnerNewRole = profile.isUserLead;
         await supabase.from('profiles').update({ is_lead: myNewRole }).eq('id', session.user.id);
         await supabase.from('profiles').update({ is_lead: partnerNewRole }).eq('id', partnerProfile.id);
         setProfile(prev => ({ ...prev, isUserLead: myNewRole }));
     }
  };
  
  const handleResetSync = async () => {
    setSharedState(prev => ({ ...prev, sync_stage: 'idle', sync_data_lead: null, sync_data_partner: null, sync_pool: null }));
    await supabase.from('couples').update({ sync_stage: 'idle', sync_data_lead: null, sync_data_partner: null, sync_pool: null }).eq('id', profile.couple_id);
  };

  const handlePurchase = async (item) => {
    if ((profile.tokens || 0) < item.cost) return; 
    setProfile(prev => ({...prev, tokens: prev.tokens - item.cost}));
    await supabase.from('profiles').update({ tokens: (profile.tokens || 0) - item.cost }).eq('id', session.user.id);
    await supabase.from('vouchers').insert([{ label: item.label, icon_name: 'Ticket' }]);
  };
  
  const handleContribute = async (amount) => {
      const currentVault = sharedState.vault_current || 0;
      const newTotal = currentVault + amount;
      setProfile(prev => ({...prev, tokens: prev.tokens - amount}));
      await supabase.from('profiles').update({ tokens: (profile.tokens || 0) - amount }).eq('id', session.user.id);
      setSharedState(prev => ({...prev, vault_current: newTotal}));
      await supabase.from('couples').update({ vault_current: newTotal }).eq('id', profile.couple_id);
  };

  if (loading || (profile?.couple_id && !sharedState)) {
      return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white"><Sparkles className="animate-spin" /></div>;
  }
  
  if (!session) return <Auth onLoginSuccess={() => fetchAllData(supabase.auth.getUser().then(({data}) => data.user.id))} />;

  const NavItem = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)} className={`relative flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === id ? 'text-white scale-110' : 'text-zinc-600 hover:text-zinc-400'}`}>
      <Icon size={24} fill={activeTab === id ? "currentColor" : "none"} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="h-[100dvh] w-full bg-zinc-950 text-zinc-200 font-sans flex justify-center selection:bg-violet-500/30 overflow-hidden fixed inset-0">
      <div className="w-full max-w-md bg-zinc-950 h-full relative shadow-2xl flex flex-col overflow-hidden font-sans">
        <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 opacity-70 shrink-0" />
        
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide overscroll-contain pb-24">
          {activeTab === 'dashboard' && (
            <Dashboard 
                profile={profile} 
                partnerProfile={partnerProfile} 
                syncedConnection={sharedState?.sync_stage === 'active' && sharedState?.sync_pool?.length > 0 ? { activity: sharedState.sync_pool[0], desc: 'Synced Plan Active' } : null} 
                partnerSignal={profile?.isUserLead ? sharedState?.signal_b : sharedState?.signal_a} 
                mySignal={profile?.isUserLead ? sharedState?.signal_a : sharedState?.signal_b} 
                onSignal={handleSignal} 
                lastActivityDate={Date.now()} 
                oliveBranchActive={sharedState?.olive_branch_active} 
                oliveBranchSender={sharedState?.olive_branch_sender} 
                oliveBranchAcceptedAt={sharedState?.olive_branch_accepted_at} 
                onOliveBranchClick={handleOliveBranchClick}
                sessionUserId={session.user.id} 
                syncStage={sharedState?.sync_stage} 
                onNavigate={setActiveTab} 
            />
          )}
          
          {profile?.couple_id ? (
              <>
                {activeTab === 'play' && (
                  <Play 
                    profile={profile} 
                    deck={activeDeck} 
                    sharedState={sharedState} 
                    onSyncInput={handleSyncInput} 
                    onLeadSelection={handleLeadSelection} 
                    onFinalSelection={handleFinalSelection} 
                    onResetSync={handleResetSync} 
                  />
                )}
                {activeTab === 'store' && (
                  <Store 
                      tokens={profile?.tokens || 0} 
                      onPurchase={handlePurchase} 
                      vault={{ current: sharedState?.vault_current || 0, goal: sharedState?.vault_goal || 50, name: sharedState?.vault_name || 'Goal' }} 
                      onContribute={handleContribute} 
                      customItems={customStoreItems} 
                      onAddCustomItem={async (item) => {
                        const { error } = await supabase.from('custom_store_items').insert([{ ...item, couple_id: profile.couple_id }]);
                        if (error) alert(error.message);
                        else fetchCustomItems(profile.couple_id);
                      }}
                      onDeleteCustomItem={async (id) => {
                        await supabase.from('custom_store_items').delete().eq('id', id);
                        fetchCustomItems(profile.couple_id);
                      }}
                      // --- NEW: Pass Update Vault Here ---
                      onUpdateVault={async (name, goal) => {
                        await supabase.from('couples').update({ vault_name: name, vault_goal: goal }).eq('id', profile.couple_id);
                      }}
                  />
                )}
                {activeTab === 'memories' && (
                  <Journal 
                    profile={profile} 
                    history={history} 
                    onAddMemory={async (newMem) => {
                        await supabase.from('history').insert([{ ...newMem, couple_id: profile.couple_id }]);
                        fetchHistory(profile.couple_id);
                    }} 
                    onDeleteMemory={async (id) => {
                        await supabase.from('history').delete().eq('id', id);
                        fetchHistory(profile.couple_id);
                    }} 
                    onUpdateMemory={async (id, updates) => {
                        await supabase.from('history').update(updates).eq('id', id);
                        fetchHistory(profile.couple_id);
                    }} 
                  />
                )}
              </>
          ) : (activeTab !== 'dashboard' && activeTab !== 'setup') && (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                  <Heart size={48} className="opacity-20"/>
                  <p>Link a partner in Config to use this.</p>
              </div>
          )}

          {activeTab === 'setup' && (
            <Config 
                profile={profile} 
                partnerProfile={partnerProfile} 
                sharedState={sharedState} 
                onUpdateProfile={(u) => { supabase.from('profiles').update(u).eq('id', session.user.id); setProfile(prev => ({...prev, ...u})); }} 
                onLogout={handleLogout} 
                activeDeck={activeDeck} 
                onAddDeckCard={async (newCard) => {
                    const cardPayload = {
                        title: newCard.title,
                        intensity: newCard.intensity,
                        category: newCard.category,
                        desc_text: newCard.desc,
                        couple_id: profile.couple_id
                    };
                    const { error } = await supabase.from('custom_deck_cards').insert([cardPayload]);
                    if (error) alert(error.message);
                    else fetchCustomDeck(profile.couple_id); 
                }} 
                onDeleteDeckCard={async (card) => {
                    const isCustom = customDeckCards.some(c => c.id === card.id);
                    if (isCustom) {
                        await supabase.from('custom_deck_cards').delete().eq('id', card.id);
                        fetchCustomDeck(profile.couple_id);
                    } else {
                        const newHidden = [...hiddenCards, String(card.id)];
                        setHiddenCards(newHidden);
                        await supabase.from('profiles').update({ hidden_card_ids: newHidden }).eq('id', session.user.id);
                    }
                }}
                onCreateLink={handleCreateLink}
                onJoinLink={handleJoinLink}
                onUnlink={handleUnlink}
                onRefresh={() => fetchAllData(session.user.id)}
            />
          )}
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