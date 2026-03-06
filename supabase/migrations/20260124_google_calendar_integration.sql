-- Google Calendar integration fields for recruiter accounts

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_email TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS google_calendar_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS google_calendar_state TEXT;

CREATE INDEX IF NOT EXISTS user_profiles_google_calendar_connected_idx
  ON user_profiles(google_calendar_connected);
