-- Add INSERT policy for profiles table
-- This allows users to create their own profile via upsert if it doesn't exist

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
