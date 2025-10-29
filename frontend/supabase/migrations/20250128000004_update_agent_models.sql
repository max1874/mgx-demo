-- Update AI Agent Models
-- This migration updates the model configurations for existing agents
-- to use the latest LLM models

-- Update Mike to use GPT-5
UPDATE agents 
SET config = jsonb_set(config, '{model}', '"openai/gpt-5"')
WHERE name = 'mike';

-- Update Emma to use Claude Sonnet 4.5
UPDATE agents 
SET config = jsonb_set(config, '{model}', '"anthropic/claude-sonnet-4.5"')
WHERE name = 'emma';

-- Update Bob to use GPT-5
UPDATE agents 
SET config = jsonb_set(config, '{model}', '"openai/gpt-5"')
WHERE name = 'bob';

-- Update Alex to use Claude Sonnet 4.5
UPDATE agents 
SET config = jsonb_set(config, '{model}', '"anthropic/claude-sonnet-4.5"')
WHERE name = 'alex';

-- Update David to use GPT-5
UPDATE agents 
SET config = jsonb_set(config, '{model}', '"openai/gpt-5"')
WHERE name = 'david';
