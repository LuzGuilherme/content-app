import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afiqwyxlwwvdwmqfzgit.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmaXF3eXhsd3d2ZHdtcWZ6Z2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NTAyNzYsImV4cCI6MjA4MjMyNjI3Nn0.B-IWcdWp044DMNKW3-xzv6dnmHUK9jyP6OcHjWgafYA';

export const supabase = createClient(supabaseUrl, supabaseKey);
