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

  const activeDeck = [...FULL_DECK, ...customDeckCards].filter(c => !hiddenCards.includes(c.id));

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

    // Listen for Shared State
    const stateChannel = supabase.channel('couple_state_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` }, (payload) => setSharedState(payload.new))
      .subscribe();

    // Listen for Partner Profile Changes
    const profileChannel = supabase.channel('profile_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `couple_id=eq.${coupleId}` }, (payload) => {
            if (payload.new.id !== session.user.id) setPartnerProfile(payload.new);
            else setProfile(prev => ({...prev, ...payload.new}));
        })
        .subscribe();
    
    // Listen for other data
    const deckChannel = supabase.channel('deck_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'custom_deck_cards' }, () => fetchCustomDeck()).subscribe();
    const itemsChannel = supabase.channel('items_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'custom_store_items' }, () => fetchCustomItems()).subscribe();
    const historyChannel = supabase.channel('history_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, () => fetchHistory()).subscribe();
    const voucherChannel = supabase.channel('voucher_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'vouchers' }, () => fetchVouchers()).subscribe();
    
    return () => supabase.removeAllChannels();
  }, [profile?.couple_id]); 

  // 3. FETCH DATA
  async function fetchAllData(userId) {
    if (!userId) return;
    let { data: myProfile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    
    if (!myProfile) {
        setProfile({ id: userId, couple_id: null, name: 'User' });
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
    } else {
        setSharedState(null);
        setPartnerProfile(null);
    }

    await Promise.all([fetchHistory(), fetchVouchers(), fetchCustomItems(), fetchCustomDeck()]);
    setLoading(false);
  }

  // --- ACTIONS ---
  const fetchHistory = async () => { const { data } = await supabase.from('history').select('*').order('created_at', { ascending: false }); setHistory(data || []); };
  const fetchVouchers = async () => { const { data } = await supabase.from('vouchers').select('*').eq('redeemed', false); setVouchers(data || []); };
  const fetchCustomItems = async () => { const { data } = await supabase.from('custom_store_items').select('*'); setCustomStoreItems(data || []); };
  const fetchCustomDeck = async () => { const { data } = await supabase.from('custom_deck_cards').select('*'); setCustomDeckCards(data || []); };

  const handleCreateLink = async () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const { data: couple } = await supabase.from('couples').insert([{ link_code: code }]).select().single();
    await supabase.from('profiles').update({ couple_id: couple.id, is_lead: true }).eq('id', session.user.id);
    await fetchAllData(session.user.id);
    return code;
  };

  const handleJoinLink = async (code) => {
    const { data: couple } = await supabase.from('couples').select('id').eq('link_code', code.toUpperCase()).single();
    if (!couple) throw new Error("Invalid Code");
    await supabase.from('profiles').update({ couple_id: couple.id, is_lead: false }).eq('id', session.user.id);
    await fetchAllData(session.user.id); 
  };

  const handleUnlink = async () => {
    await supabase.from('profiles').update({ couple_id: null }).eq('id', session.user.id);
    setProfile(prev => ({ ...prev, couple_id: null }));
    setPartnerProfile(null);
    setSharedState(null);
  };
  
  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };

  // ... (Abbreviated core functions)
  const handleSignal = async (signalId) => {
    if (!profile?.couple_id) return;
    const col = profile.is_lead ? 'signal_a' : 'signal_b';
    const val = (profile.is_lead ? sharedState.signal_a : sharedState.signal_b) === signalId ? null : signalId;
    await supabase.from('couples').update({ [col]: val }).eq('id', profile.couple_id);
  };

  const handlePurchase = async (item) => {
    if ((profile.tokens || 0) < item.cost) return; 
    await supabase.from('profiles').update({ tokens: (profile.tokens || 0) - item.cost }).eq('id', session.user.id);
    await supabase.from('vouchers').insert([{ label: item.label, icon_name: 'Ticket' }]);
    setProfile(prev => ({...prev, tokens: prev.tokens - item.cost}));
  };

  // --- RENDER ---
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white"><Sparkles className="animate-spin" /></div>;
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
          {activeTab === 'dashboard' && <Dashboard profile={profile} partnerProfile={partnerProfile} syncedConnection={sharedState?.sync_stage === 'active' ? { activity: sharedState.sync_pool[0], desc: 'Synced Plan Active' } : null} partnerSignal={profile?.is_lead ? sharedState?.signal_b : sharedState?.signal_a} setPartnerSignal={() => handleSignal(profile?.is_lead ? sharedState?.signal_b : sharedState?.signal_a)} onSignal={handleSignal} mySignal={profile?.is_lead ? sharedState?.signal_a : sharedState?.signal_b} lastActivityDate={Date.now()} oliveBranchActive={sharedState?.olive_branch_active} oliveBranchSender={sharedState?.olive_branch_sender} oliveBranchAcceptedAt={sharedState?.olive_branch_accepted_at} sessionUserId={session.user.id} syncStage={sharedState?.sync_stage} onNavigate={setActiveTab} />}
          
          {profile?.couple_id ? (
              <>
                {activeTab === 'play' && <Play profile={profile} deck={activeDeck} sharedState={sharedState} onSyncInput={() => {}} onLeadSelection={() => {}} onFinalSelection={() => {}} onResetSync={() => {}} />}
                {activeTab === 'store' && <Store tokens={profile?.tokens || 0} onPurchase={handlePurchase} vault={{ current: sharedState?.vault_current || 0, goal: sharedState?.vault_goal || 50, name: sharedState?.vault_name || 'Goal' }} onContribute={() => {}} customItems={customStoreItems} onAddCustomItem={() => {}} onDeleteCustomItem={() => {}} />}
                {activeTab === 'memories' && <Journal profile={profile} history={history} onAddMemory={() => {}} onDeleteMemory={() => {}} onUpdateMemory={() => {}} />}
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
                onUpdateProfile={(u) => { supabase.from('profiles').update(u).eq('id', session.user.id); setProfile(prev => ({...prev, ...u})); }} 
                onLogout={handleLogout} 
                activeDeck={activeDeck} 
                onAddDeckCard={() => {}} 
                onDeleteDeckCard={() => {}} 
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