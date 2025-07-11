CREATE TABLE orders (
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
  sequence_number INTEGER DEFAULT 0, 

  ---- Debezium Outbox Event Router required END ------
  -----------------------------------------------------

  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITHOUT TIME ZONE NULL,

  UNIQUE (aggregate_id, sequence_number)
);

CREATE INDEX idx_outbox_unprocessed 
ON outbox (processed_at, created_at)
INCLUDE (id, aggregate_id, aggregate_type, sequence_number, payload)
WHERE processed_at IS NULL;
