-- Jam session: per-user, per UTC day completion markers (separate from global MND completion).
CREATE TABLE IF NOT EXISTS app_user_mnd_jam_exercise_day_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_user_id uuid NOT NULL REFERENCES app_users (id) ON DELETE CASCADE,
  day_key_utc varchar(10) NOT NULL,
  mnd_exercise_id uuid NOT NULL REFERENCES mnd_exercises (id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_jam_day_exercise UNIQUE (app_user_id, day_key_utc, mnd_exercise_id)
);

CREATE INDEX IF NOT EXISTS ix_jam_day_user_day
  ON app_user_mnd_jam_exercise_day_completions (app_user_id, day_key_utc);
