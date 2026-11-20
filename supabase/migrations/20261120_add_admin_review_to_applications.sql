-- Migration: Add admin review and deliverable document columns to service_applications
ALTER TABLE public.service_applications 
ADD COLUMN IF NOT EXISTS admin_note TEXT,
ADD COLUMN IF NOT EXISTS result_file_url TEXT,
ADD COLUMN IF NOT EXISTS result_file_name TEXT;

-- Also add to applications table in case an alias or duplicate table is used
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'applications') THEN
    ALTER TABLE public.applications 
    ADD COLUMN IF NOT EXISTS admin_note TEXT,
    ADD COLUMN IF NOT EXISTS result_file_url TEXT,
    ADD COLUMN IF NOT EXISTS result_file_name TEXT;
  END IF;
END $$;

-- Migration: Create Supabase Storage Bucket for deliverable documents (PDFs / Images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-deliverables', 'application-deliverables', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Security Policies for application-deliverables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deliverables Public Read Policy') THEN
    CREATE POLICY "Deliverables Public Read Policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'application-deliverables');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deliverables Upload Policy') THEN
    CREATE POLICY "Deliverables Upload Policy" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'application-deliverables');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Deliverables Update Policy') THEN
    CREATE POLICY "Deliverables Update Policy" ON storage.objects
    FOR UPDATE USING (bucket_id = 'application-deliverables');
  END IF;
END $$;
