CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::TEXT,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE outbox (
  -----------------------------------------------------
  ---- Debezium Outbox Event Router required BEGIN ----

  id SERIAL PRIMARY KEY,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL, 
  payload JSONB NOT NULL,

  ---- Debezium Outbox Event Router required END ------
  -----------------------------------------------------
  
  ---------------------------------------------------------------
  ---- Could be placed here or in the payload column as JSON ----

  -- event_type TEXT NOT NULL,
  -- sequence_number INTEGER NOT NULL, 

  ---- I decided to place in the payload column -----------------
  ---------------------------------------------------------------

  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITHOUT TIME ZONE NULL
);

CREATE UNIQUE INDEX idx_outbox_entity_sequence ON outbox (aggregate_id, sequence_number);
CREATE INDEX idx_outbox_unprocessed ON outbox (processed_at, created_at) WHERE processed_at IS NULL;

CREATE PUBLICATION publication FOR ALL TABLES;
