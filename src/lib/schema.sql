-- Drop tables if they exist to ensure a clean slate. 
-- Note: This will delete all data in these tables.
DROP TABLE IF EXISTS public.edges CASCADE;
DROP TABLE IF EXISTS public.nodes CASCADE;
DROP TABLE IF EXISTS public.flows CASCADE;
DROP TABLE IF EXISTS public.broadcasts CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Create the conversations table
CREATE TABLE public.conversations (
  id TEXT PRIMARY KEY,
  contact_wuid TEXT NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assignee_id UUID REFERENCES auth.users(id)
);

-- RLS for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to access conversations" ON public.conversations FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create the messages table
CREATE TABLE public.messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_from_contact BOOLEAN NOT NULL,
  sender_wuid TEXT NOT NULL
);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to access messages" ON public.messages FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create the notes table
CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id TEXT NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    author_email TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notes" ON public.notes FOR ALL
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Allow users to view notes in assigned conversations" ON public.notes FOR SELECT
    USING (auth.role() = 'authenticated');


-- Create the contacts table
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    whatsapp_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, whatsapp_number)
);

-- RLS for contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own contacts" ON public.contacts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create the broadcasts table
CREATE TABLE public.broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    template_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for broadcasts
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage their own broadcasts" ON public.broadcasts FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create flows table
CREATE TABLE public.flows (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for flows
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own flows" ON public.flows FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create nodes table
CREATE TABLE public.nodes (
  id TEXT PRIMARY KEY,
  flow_id UUID REFERENCES public.flows(id) ON DELETE CASCADE NOT NULL,
  data JSONB,
  position JSONB,
  type TEXT
);

-- RLS for nodes
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage nodes in their own flows" ON public.nodes FOR ALL
  USING (
    (
      SELECT user_id
      FROM public.flows
      WHERE id = flow_id
    ) = auth.uid()
  )
  WITH CHECK (
    (
      SELECT user_id
      FROM public.flows
      WHERE id = flow_id
    ) = auth.uid()
  );


-- Create edges table
CREATE TABLE public.edges (
  id TEXT PRIMARY KEY,
  flow_id UUID REFERENCES public.flows(id) ON DELETE CASCADE NOT NULL,
  source_node_id TEXT REFERENCES public.nodes(id) ON DELETE CASCADE,
  target_node_id TEXT REFERENCES public.nodes(id) ON DELETE CASCADE
);

-- RLS for edges
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage edges in their own flows" ON public.edges FOR ALL
  USING (
    (
      SELECT user_id
      FROM public.flows
      WHERE id = flow_id
    ) = auth.uid()
  )
  WITH CHECK (
    (
      SELECT user_id
      FROM public.flows
      WHERE id = flow_id
    ) = auth.uid()
  );

-- Enable Realtime on tables
-- Note: You may still need to enable this in the Supabase UI under Database > Replication.
-- However, these statements attempt to add them to the publication.
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations, public.messages, public.notes;
