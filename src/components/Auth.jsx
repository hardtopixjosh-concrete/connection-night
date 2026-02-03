import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Heart, Loader2, User, Lock, Key } from 'lucide-react';

export default function Auth({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [mode, setMode] = useState('login'); 
  const [error, setError] = useState(null);

  // Auto-login check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) onLoginSuccess();
    });
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fakeEmail = `${cleanUsername}@connection-app.com`;

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
        if (error) throw error;
        onLoginSuccess();
      } else {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: cleanUsername, password, name })
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Signup failed');
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
        if (loginError) throw loginError;
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

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