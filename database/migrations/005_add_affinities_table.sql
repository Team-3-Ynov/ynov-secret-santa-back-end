-- Add the event_affinities table to store participant affinity preferences for the draw.
-- Affinity values: 'avoid' (soft exclusion), 'neutral' (no preference), 'favorable' (preferred).
CREATE TABLE IF NOT EXISTS event_affinities (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    giver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    affinity VARCHAR(10) NOT NULL CHECK (affinity IN ('avoid', 'neutral', 'favorable')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, giver_id, target_id),
    CHECK (giver_id <> target_id)
);
