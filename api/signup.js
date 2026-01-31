import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Create a fake email so Supabase is happy
  // "Josh" -> "josh@connection-app.com"
  const fakeEmail = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@connection-app.com`;

  try {
    // Initialize Supabase with the GOD MODE key (Service Role)
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // This is the key you just added
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Force-create the user (Bypassing email confirmation!)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: password,
      email_confirm: true, // This marks them as verified immediately
      user_metadata: { name: name }
    });

    if (error) throw error;

    return res.status(200).json({ success: true, email: fakeEmail });

  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(400).json({ error: error.message });
  }
}