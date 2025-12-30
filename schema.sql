-- Drop the old table to ensure we start fresh with the correct structure
drop table if exists saved_graphs;

-- Create the table with the user_id column
create table saved_graphs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users not null default auth.uid(),
  nodes jsonb default '[]'::jsonb,
  edges jsonb default '[]'::jsonb,
  chats jsonb default '{}'::jsonb,
  name text default 'Untitled Canvas'
);

-- Enable RLS
alter table saved_graphs enable row level security;

-- Create secure policies
create policy "Users can only see their own graphs"
on saved_graphs for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own graphs"
on saved_graphs for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own graphs"
on saved_graphs for update
to authenticated
using (auth.uid() = user_id);

-- Create voice_personas table
create table voice_personas (
  id uuid primary key,
  user_id uuid references auth.users not null default auth.uid(),
  name text not null,
  type text not null,
  language text not null,
  custom_instructions text,
  samples jsonb default '[]'::jsonb,
  created_at bigint not null
);

-- Enable RLS for voice_personas
alter table voice_personas enable row level security;

-- Create secure policies for voice_personas
create policy "Users can only see their own voices"
on voice_personas for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own voices"
on voice_personas for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own voices"
on voice_personas for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own voices"
on voice_personas for delete
to authenticated
using (auth.uid() = user_id);
