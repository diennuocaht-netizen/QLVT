-- =====================================================
-- FIX DOCUMENTS TABLE COLUMN NAMES  
-- Ensure all document columns use snake_case naming
-- This script safely adds missing columns or skips if already exist
-- =====================================================

-- Ensure the documents table has all required snake_case columns
-- All columns use IF NOT EXISTS to avoid errors if already present

ALTER TABLE documents
ADD COLUMN IF NOT EXISTS system_code TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS issue_date DATE,
ADD COLUMN IF NOT EXISTS update_date DATE,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS author_name TEXT;

-- =====================================================
-- MIGRATE DATA FROM OLD COLUMNS IF THEY EXIST
-- Only run if you had old camelCase columns
-- =====================================================

-- Check and migrate from old column names (if they exist)
DO $$
BEGIN
  -- Only migrate if the old columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'systemcode') THEN
    UPDATE documents SET system_code = systemcode WHERE systemcode IS NOT NULL AND system_code IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'documenttype') THEN
    UPDATE documents SET document_type = documenttype WHERE documenttype IS NOT NULL AND document_type IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'issuedate') THEN
    UPDATE documents SET issue_date = issuedate WHERE issuedate IS NOT NULL AND issue_date IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'updatedate') THEN
    UPDATE documents SET update_date = updatedate WHERE updatedate IS NOT NULL AND update_date IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'fileurl') THEN
    UPDATE documents SET file_url = fileurl WHERE fileurl IS NOT NULL AND file_url IS NULL;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'authorname') THEN
    UPDATE documents SET author_name = authorname WHERE authorname IS NOT NULL AND author_name IS NULL;
  END IF;
END
$$;

-- Drop old columns only if they exist
ALTER TABLE documents
DROP COLUMN IF EXISTS systemcode;

ALTER TABLE documents
DROP COLUMN IF EXISTS documenttype;

ALTER TABLE documents
DROP COLUMN IF EXISTS issuedate;

ALTER TABLE documents
DROP COLUMN IF EXISTS updatedate;

ALTER TABLE documents
DROP COLUMN IF EXISTS fileurl;

ALTER TABLE documents
DROP COLUMN IF EXISTS authorname;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this query to verify the table structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents' ORDER BY column_name;
