// Supabase client helpers (frontend)
// Usage: add <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js/dist/umd/supabase.js"></script>
// and set window.SUPABASE_URL and window.SUPABASE_ANON_KEY in index.html or env.

(function(){
  function init() {
    if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) return null;
    const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    return supabase;
  }

  const client = init();

  window.SupabaseClient = {
    isEnabled: !!client,
    signUp: async (email, password, metadata) => {
      if (!client) throw new Error('Supabase not configured');
      return client.auth.signUp({ email, password }, { data: metadata });
    },
    signIn: async (email, password) => {
      if (!client) throw new Error('Supabase not configured');
      return client.auth.signIn({ email, password });
    },
    signOut: async () => { if (!client) return; return client.auth.signOut(); },
    getBusinesses: async () => {
      if (!client) return { data: null };
      return client.from('businesses').select('*').order('created_at', { ascending: false });
    },
    addBusiness: async (business) => {
      if (!client) throw new Error('Supabase not configured');
      return client.from('businesses').insert([business]);
    },
    uploadImage: async (bucket, path, file) => {
      if (!client) throw new Error('Supabase not configured');
      const { error } = await client.storage.from(bucket).upload(path, file);
      if (error) throw error;
      const { publicURL, error: urlError } = client.storage.from(bucket).getPublicUrl(path);
      if (urlError) throw urlError;
      return publicURL;
    },
    createCheckoutSession: async (data) => {
      // This requires a server endpoint to create a Stripe checkout session tied to a plan
      throw new Error('Create a server endpoint to create Stripe Checkout sessions');
    }
  };
})();
