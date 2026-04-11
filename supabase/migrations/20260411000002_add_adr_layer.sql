-- Drop the existing layer check constraint
ALTER TABLE docs_pages DROP CONSTRAINT IF EXISTS docs_pages_layer_check;

-- Add the new layer check constraint including 'adr'
ALTER TABLE docs_pages ADD CONSTRAINT docs_pages_layer_check
  CHECK (layer IN ('concept','quickstart','howto','reference','adr'));
