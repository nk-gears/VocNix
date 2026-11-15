-- ==============================================================================
-- Migration 007: Add use_mono column to events table
-- ==============================================================================
-- Defaults to true (mono audio mode) to reduce network bandwidth consumption
-- by ~50% across translators and audience streams.
-- Can be toggled per-event to false for regular stereo audio.
-- ==============================================================================

ALTER TABLE events
ADD COLUMN IF NOT EXISTS use_mono BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN events.use_mono IS 'Whether audio broadcast and listening channels operate in mono (default, bandwidth-saver at 24kbps) or full stereo (64kbps)';
