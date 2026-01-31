import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Heart, Loader2, Copy, User, Lock, Key } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(''); // USERNAME only
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [mode, setMode] = useState('login'); 
  const [linkCode, setLinkCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [error, setError] = useState(null);

  // 1. Handle Auth
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Generate the fake email locally so we can login with it
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
        
        // Call your new API route
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
      const { data: couple, error: cErr } = await supabase.from('couples').insert([{ link_code: code }]).select().single();
      if (cErr) throw cErr;

      const { error: pErr } = await supabase.from('profiles').upsert({ 
          id: session.user.id, couple_id: couple.id, is_lead: true, name, partner_name: 'Partner' 
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

      await supabase.from('profiles').upsert({ 
          id: session.user.id, couple_id: couple.id, is_lead: false, name, partner_name: 'Partner' 
      });
      onLoginSuccess();
    } catch (err) { setError(err.message); setLoading(false); }
  };

  if (mode === 'link') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <Heart size={48} className="text-violet-500 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Partner</h2>
        <p className="text-zinc-400 mb-8">Welcome, <span className="text-white font-bold">{name}</span>!</p>

        {!generatedCode ? (
          <div className="w-full max-w-sm space-y-4">
             <button onClick={createCouple} disabled={loading} className="w-full py-4 bg-violet-600 rounded-xl text-white font-bold">{loading ? <Loader2 className="animate-spin mx-auto"/> : "I'm the First One (Get Code)"}</button>
             <div className="flex gap-2">
               <input type="text" placeholder="PARTNER CODE" value={linkCode} onChange={(e) => setLinkCode(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 text-center text-white outline-none font-mono uppercase" />
               <button onClick={joinCouple} disabled={!linkCode || loading} className="px-6 bg-zinc-800 rounded-xl text-white font-bold">Join</button>
             </div>
             {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
          </div>
        ) : (
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
             <h3 className="text-zinc-400 text-sm uppercase mb-4">Your Link Code</h3>
             <div className="text-4xl font-mono font-black text-white tracking-widest mb-6" onClick={() => navigator.clipboard.writeText(generatedCode)}>{generatedCode}</div>
             <button onClick={() => onLoginSuccess()} className="w-full py-3 bg-emerald-500 text-zinc-950 font-bold rounded-xl">Done (Enter App)</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <Heart size={48} className="text-violet-500 mb-6 animate-pulse" />
      <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Connection Night</h1>
      
      <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4">
        {mode === 'signup' && (
           <div className="relative">
             <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none" />
           </div>
        )}
        
        <div className="relative">
             <Key size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none" />
        </div>

        <div className="relative">
             <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
             <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 pl-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none" />
        </div>
        
        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-sm text-center">{error}</div>}

        <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-bold rounded-xl flex justify-center items-center gap-2">
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