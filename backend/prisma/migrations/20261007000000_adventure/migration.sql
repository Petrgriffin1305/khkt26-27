-- A transactional aggregate for the small private-group MVP. All updates lock
-- this row; split aggregates by journey before scaling beyond the pilot.
CREATE TABLE adventure_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state JSONB NOT NULL DEFAULT '{"people":{},"groups":{},"sessions":{},"invites":{}}'::jsonb
);
INSERT INTO adventure_state (id) VALUES (1);
