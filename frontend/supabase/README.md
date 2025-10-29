# Supabase Database Schema Documentation

This directory contains SQL migration files for the MGX Demo database schema.

## Overview

The MGX Demo platform uses Supabase (PostgreSQL) as its primary backend service, providing:

- **Authentication**: User registration, login, and OAuth
- **Database**: Relational data storage with JSONB support
- **Storage**: File and media storage
- **Realtime**: WebSocket-based real-time updates
- **Edge Functions**: Serverless backend logic

## Database Schema

### Core Tables

1. **profiles** - User profile information
   - Extends Supabase `auth.users` table
   - Stores username, avatar, credits, subscription tier

2. **projects** - Project metadata and generated code
   - Stores project name, description, visibility settings
   - Contains generated HTML/CSS/JS code as JSONB
   - Supports versioning and Remix (parent_project_id)

3. **conversations** - Chat sessions
   - Links projects to chat conversations
   - Tracks collaboration mode (team, engineer, research, race)

4. **messages** - Individual chat messages
   - Stores user and AI agent messages
   - Includes agent name and metadata (code blocks, file references)

5. **agents** - AI agent definitions
   - Defines available AI agents (Mike, Emma, Bob, Alex, David)
   - Stores system prompts and configuration

6. **agent_executions** - Execution logs
   - Tracks all agent executions for debugging and analytics
   - Records input, output, tokens used, execution time

7. **files** - File metadata
   - Links files to projects
   - References Supabase Storage for actual file content

8. **versions** - Project version snapshots
   - Stores complete project snapshots for history and Remix
   - Enables version rollback

9. **deployments** - Deployment records
   - Tracks project deployment history
   - Stores deployment URLs and status

## Migration Files

### 20250128000001_initial_schema.sql
Creates all database tables, indexes, triggers, and seed data.

**Key Features:**
- UUID primary keys with auto-generation
- Foreign key relationships with cascading deletes
- Check constraints for data validation
- Indexes for optimized queries
- Triggers for auto-updating `updated_at` timestamps
- Seed data for default AI agents

### 20250128000002_row_level_security.sql
Configures Row Level Security (RLS) policies for data protection.

**Security Model:**
- Users can only access their own data (projects, conversations, messages)
- Public projects are readable by everyone
- Link-only projects require direct URL access
- Agents are readable by all authenticated users
- Service role required for system operations (agent executions)

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: MGX Demo
   - Database Password: (generate strong password)
   - Region: (choose closest to your users)
4. Wait for project to be provisioned (~2 minutes)

### 2. Get API Credentials

1. In your project dashboard, go to Settings > API
2. Copy the following values:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - `anon` public key
   - `service_role` secret key (for server-side operations)

### 3. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Update the values:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Migrations

#### Option A: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

#### Option B: Using SQL Editor (Manual)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file:
   - First: `20250128000001_initial_schema.sql`
   - Then: `20250128000002_row_level_security.sql`
4. Click "Run" for each migration

### 5. Create Storage Buckets

Create the following storage buckets in Supabase Dashboard (Storage section):

1. **avatars** (Public bucket)
   - For user profile pictures
   - Public access enabled

2. **project-files** (Private bucket)
   - For project source files
   - Access controlled by RLS policies

3. **deployments** (Public bucket)
   - For deployed project assets
   - Public access enabled

### 6. Configure Storage Policies

For each bucket, set up the following policies:

#### avatars bucket:
```sql
-- SELECT: Anyone can view avatars
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- INSERT: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### project-files bucket:
```sql
-- SELECT: Users can view files in their projects
CREATE POLICY "Users can view files in their projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- INSERT: Users can upload files to their projects
CREATE POLICY "Users can upload files to their projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- UPDATE: Users can update files in their projects
CREATE POLICY "Users can update files in their projects"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- DELETE: Users can delete files in their projects
CREATE POLICY "Users can delete files in their projects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 7. Enable Realtime

Enable Realtime for tables that need live updates:

1. Go to Database > Replication
2. Enable replication for the following tables:
   - `messages` (for live chat updates)
   - `agent_executions` (for live agent status)
   - `projects` (for live code updates)

## Testing the Setup

### 1. Test Database Connection

```typescript
import { supabase } from './src/lib/supabase';

// Test connection
const { data, error } = await supabase
  .from('agents')
  .select('*');

console.log('Agents:', data);
```

### 2. Test Authentication

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'securepassword123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'securepassword123',
});
```

### 3. Test Realtime

```typescript
// Subscribe to new messages
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

## Troubleshooting

### Connection Issues

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check if Supabase project is active (not paused)
- Ensure network allows connections to Supabase

### RLS Policy Issues

- Check if RLS is enabled on tables
- Verify policies match your use case
- Use service role key for admin operations

### Migration Errors

- Ensure migrations run in correct order
- Check for syntax errors in SQL
- Verify foreign key relationships exist

## Best Practices

1. **Never expose service role key** in client-side code
2. **Always use RLS policies** for data security
3. **Use transactions** for multi-table operations
4. **Index frequently queried columns** for performance
5. **Monitor database usage** in Supabase dashboard
6. **Backup database regularly** using Supabase backups
7. **Test RLS policies** thoroughly before production

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## Support

For issues or questions:
- Check [Supabase Discord](https://discord.supabase.com)
- Review [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- Contact project maintainer: Bob (System Architect)
