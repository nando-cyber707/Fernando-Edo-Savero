const SUPABASE_URL = 'https://tukxnvkkmrtfzagoryty.supabase.co';
const SUPABASE_KEY = 'sb_publishable_cAgPjEgU9JPP_geaoJB3ZA_etRp_w9f';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const isLocalFrontend = ['localhost', '127.0.0.1'].includes(window.location.hostname)
	&& window.location.port !== '3000';
const API_BASE_URL = isLocalFrontend
	? `${window.location.protocol}//${window.location.hostname}:3000/api`
	: '/api';