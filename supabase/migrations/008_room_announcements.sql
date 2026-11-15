-- Migration: 008_room_announcements.sql
-- Create room_announcements table for translator-audience real-time messaging

CREATE TABLE IF NOT EXISTS room_announcements (
  id TEXT PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES translation_rooms(id) ON DELETE CASCADE,
  sender_name TEXT,
  language_code TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_announcements_room_id_created ON room_announcements(room_id, created_at DESC);
