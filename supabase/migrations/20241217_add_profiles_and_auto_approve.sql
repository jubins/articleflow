-- Add auto-approve and social profiles features

-- Add auto-approve to workflows
ALTER TABLE workflows
ADD COLUMN auto_approve BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN workflows.auto_approve IS 'Auto-approve articles without manual review';

-- Add social media profiles to profiles table
ALTER TABLE profiles
ADD COLUMN linkedin_handle TEXT,
ADD COLUMN twitter_handle TEXT,
ADD COLUMN github_handle TEXT,
ADD COLUMN bio TEXT,
ADD COLUMN website TEXT;

COMMENT ON COLUMN profiles.linkedin_handle IS 'LinkedIn username (e.g., johndoe)';
COMMENT ON COLUMN profiles.twitter_handle IS 'Twitter/X username (e.g., @johndoe)';
COMMENT ON COLUMN profiles.github_handle IS 'GitHub username (e.g., johndoe)';
COMMENT ON COLUMN profiles.bio IS 'Short professional bio for article signatures';
COMMENT ON COLUMN profiles.website IS 'Personal or professional website URL';
