-- Remove Iris agent and update avatar URLs for remaining agents
-- This migration removes the Iris agent and updates avatar URLs to use local images

-- Delete Iris agent
DELETE FROM agents WHERE name = 'Iris';

-- Update avatar URLs to use local images
UPDATE agents SET config = jsonb_set(config, '{avatar_url}', '"/avatars/mike.png"') WHERE name = 'mike';
UPDATE agents SET config = jsonb_set(config, '{avatar_url}', '"/avatars/emma.png"') WHERE name = 'emma';
UPDATE agents SET config = jsonb_set(config, '{avatar_url}', '"/avatars/bob.png"') WHERE name = 'bob';
UPDATE agents SET config = jsonb_set(config, '{avatar_url}', '"/avatars/alex.png"') WHERE name = 'alex';
UPDATE agents SET config = jsonb_set(config, '{avatar_url}', '"/avatars/david.png"') WHERE name = 'david';
