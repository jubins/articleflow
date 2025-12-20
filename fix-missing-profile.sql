-- Fix for existing users who signed up before the trigger was updated
-- This script creates missing profiles and user_settings for existing auth users

-- Step 1: Create profiles for users who don't have one
INSERT INTO profiles (id, email, full_name)
SELECT
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name'
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Step 2: Create user_settings for users who don't have one
INSERT INTO user_settings (user_id, default_ai_provider, default_word_count)
SELECT
    p.id,
    'claude',
    2000
FROM profiles p
LEFT JOIN user_settings us ON us.user_id = p.id
WHERE us.user_id IS NULL;

-- Verify the fix
SELECT
    au.email,
    CASE WHEN p.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_profile,
    CASE WHEN us.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_settings
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN user_settings us ON us.user_id = au.id;
