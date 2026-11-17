-- Batalha Naval: placar, sessões e partidas (P26-3A-C938-E66F-589C-7FD7)
ALTER TABLE discord_users ADD COLUMN wins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE discord_users ADD COLUMN losses INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL,
  player_ships TEXT NOT NULL, enemy_ships TEXT NOT NULL,
  player_shots TEXT NOT NULL DEFAULT '[]', enemy_shots TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active', winner TEXT, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id, status);
