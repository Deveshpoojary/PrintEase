import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lyfjzflzrsjgycyovjkm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5Zmp6Zmx6cnNqZ3ljeW92amttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjcxNDksImV4cCI6MjA2NTA0MzE0OX0.jO-jWMsZ7EcgmmFgh-LHbFM9hhV6ikEQVR96Uv2TWwk";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
