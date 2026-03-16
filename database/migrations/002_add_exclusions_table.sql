-- Add the event_exclusions table to store nominative exclusions for events.
-- This table will be used to prevent a user from being assigned to another user during the draw.
CREATE TABLE event_exclusions (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    giver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, giver_id, receiver_id),
    CHECK (giver_id <> receiver_id)
);