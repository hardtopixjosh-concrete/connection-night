import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Heart, Loader2, Copy, User, Lock, Key } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'link'
  const [linkCode, setLinkCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [error, setError] = useState(null);

  // 0. Auto-check session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        checkLinkStatus(session.user.id);
      }
    };
    checkSession();
  }, []);

  // 1. Handle Auth (Login or Signup)
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Create the "fake" email for Supabase
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fakeEmail = `${cleanUsername}@connection-app.com`;

    try {
      if (mode === 'login') {
        // LOGIN: Just try to sign in directly
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email: fakeEmail, 
            password 
        });
        if (error) throw error;
        if (data.user) checkLinkStatus(data.user.id);
      } else {
        // SIGNUP: Use the Vercel Backdoor API
        if (!name.trim()) throw new Error("Please enter your name.");
        
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: cleanUsername, password, name })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Signup failed');

        // Success! Now log them in immediately
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
            email: fakeEmail, 
            password 
        });
        
        if (loginError) throw loginError;
        checkLinkStatus(loginData.user.id);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 2. Check if user is already linked to a couple
  const checkLinkStatus = async (userId) => {
    const { data: profile } = await supabase.from('profiles').select('couple_id, name').eq('id', userId).maybeSingle();
    
    if (profile?.name) setName(profile.name);

    if (profile?.couple_id) {
       onLoginSuccess();
    } else {
       setMode('link');
       setLoading(false);
    }
  };

  // 3. Create Couple (Generate Code)
  const createCouple = async () => {
    setLoading(true);
    try {
      if (!name.trim()) throw new Error("Please enter your name.");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session lost. Refresh.");
      
      const code = Math.random().toString(36).substring(2, 6).toUpperCase();
      
      // Create Couple
      const { data: couple, error: cErr } = await supabase.from('couples').insert([{ link_code: code }]).select().single();
      if (cErr) throw cErr;

      // Upsert Profile
      const { error: pErr } = await supabase.from('profiles').upsert({ 
          id: session.user.id, 
          couple_id: couple.id, 
          is_lead: true, 
          name, 
          partner_name: 'Partner' 
      });
      if (pErr) throw pErr;
      
      setGeneratedCode(code);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  // 4. Join Couple
  const joinCouple = async () => {
    setLoading(true);
    try {
      if (!name.trim()) throw new Error("Please enter your name.");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session lost. Refresh.");

      const { data: couple } = await supabase.from('couples').select('id').eq('link_code', linkCode.toUpperCase()).single();
      if (!couple) throw new Error("Invalid code.");

      // Upsert Profile
      await supabase.from('profiles').upsert({ 
          id: session.user.id, 
          couple_id: couple.id, 
          is_lead: false, 
          name, 
          partner_name: 'Partner' 
      });
      
      onLoginSuccess();
    } catch (err) { setError(err.message); setLoading(false); }
  };

  // --- RENDER ---

  // MODE: LINK (Connect Partner)
  if (mode === 'link') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <Heart size={48} className="text-violet-500 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Partner</h2>
        <p className="text-zinc-400 mb-8">Welcome, <span className="text-white font-bold">{name || 'User'}</span>!</p>

        {!generatedCode ? (
          <div className="w-full max-w-sm space-y-4">
             {/* Name Confirmation (Just in case) */}
             {!name && <input type="text" placeholder="Confirm Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-white" />}
             
             <button onClick={createCouple} disabled={loading} className="w-full py-4 bg-violet-600 rounded-xl text-white font-bold hover:bg-violet-500 transition-all">
               {loading ? <Loader2 className="animate-spin mx-auto"/> : "I'm the First One (Get Code)"}
             </button>
             
             <div className="relative border-t border-zinc-800 my-6">
               <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-950 px-2 text-zinc-500 text-xs uppercase font-bold">OR</span>
             </div>

             <div className="flex gap-2">
               <input type="text" placeholder="PARTNER CODE" value={linkCode} onChange={(e) => setLinkCode(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 text-center text-white outline-none font-mono uppercase tracking-widest" />
               <button onClick={joinCouple} disabled={!linkCode || loading} className="px-6 bg-zinc-800 rounded-xl text-white font-bold hover:bg-zinc-700">Join</button>
             </div>
             {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
          </div>
        ) : (
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-6 rounded-2xl animate-in zoom-in">
             <h3 className="text-zinc-400 text-sm uppercase tracking-widest mb-4">Your Link Code</h3>
             <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4 relative group cursor-pointer" onClick={() => navigator.clipboard.writeText(generatedCode)}>
                <div className="text-4xl font-mono font-black text-white tracking-[0.2em] text-center">{generatedCode}</div>
                <div className="absolute top-2 right-2 text-zinc-600 group-hover:text-white transition-colors"><Copy size={14}/></div>
             </div>
             <p className="text-zinc-500 text-xs mb-6">Tell your partner to create an account, select <strong>"Join"</strong>, and enter this code.</p>
             <button onClick={() => onLoginSuccess()} className="w-full py-3 bg-emerald-500 text-zinc-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors">Done (Enter App)</button>
          </div>
        )}
      </div>
    );
  }

  // MODE: LOGIN / SIGNUP
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <Heart size={48} className="text-violet-500 mb-6 animate-pulse" />
      <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Connection Night</h1>
      
      <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
        
        {mode === 'signup' && (
           <div className="relative animate-in slide-in-from-top-2">
             <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-violet-500 transition-all" />
           </div>
        )}
        
        <div className="relative">
             <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-violet-500 transition-all" />
        </div>

        <div className="relative">
             <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-violet-500 transition-all" />
        </div>
        
        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-sm text-center font-medium">{error}</div>}

        <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex justify-center items-center gap-2">
          {loading && <Loader2 className="animate-spin" size={20} />}
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }} className="mt-6 text-zinc-500 text-sm hover:text-white transition-colors">
        {mode === 'login' ? "New here? Create Account" : "Already have an account? Sign In"}
      </button>
    </div>
  );
}