import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfolqzxzbsdbkrimenlc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmb2xxenh6YnNkYmtyaW1lbmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMDMxMjgsImV4cCI6MjA3Nzc3OTEyOH0.JdESdVrGI6fia-aYN6doW_hmu3rMoSN6h40ujXFTEBM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
