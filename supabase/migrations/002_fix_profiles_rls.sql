-- Fix profiles RLS policy
-- Add INSERT policy so users can create their own profile

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create INSERT policy for profiles
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Also ensure the trigger function has proper permissions
-- (handle_new_user function already exists and is SECURITY DEFINER)
