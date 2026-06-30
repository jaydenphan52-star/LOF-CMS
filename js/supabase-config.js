// TODO: Replace with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://utudvkpisqrzlmwexzes.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dWR2a3Bpc3Fyemxtd2V4emVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4NTE2OTgsImV4cCI6MjA5ODQyNzY5OH0.5XStRN8OhdhJbsLyLBvZkcHGL25P9fic0fz2KpXKNbE';

window._sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
