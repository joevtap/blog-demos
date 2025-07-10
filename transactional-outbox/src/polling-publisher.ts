import type { Row, RowList, TransactionSql } from "postgres";
import { sql } from "./db/db.js";
import { publishEvent } from "./broker/broker.js";

if (!process.env.BATCH_SIZE || !process.env.POLL_INTERVAL) {
  throw new Error(
    "Missing BATCH_SIZE and/or POLL_INTERVAL environment variables!"
  );
}

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10);
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL, 10);

export async function pollingPublisher() {
  while (true) {
    const error = await tryPollingAndPublishing();

    if (error) console.log(error);

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

async function tryPollingAndPublishing() {
  try {
    await sql.begin(async (tx) => {
      const events = await getEvents(tx);
      await publishEvents(tx, events);
    });
  } catch (err) {
    return new Error(`Polling failed: ${err}`);
  }
}

async function getEvents(tx: TransactionSql) {
  return await tx`
    SELECT id, aggregate_id, aggregate_type, payload, sequence_number
    FROM outbox
    WHERE processed_at IS NULL
    ORDER BY created_at
    LIMIT ${BATCH_SIZE}
    FOR UPDATE SKIP LOCKED
  `;
}

async function publishEvents(tx: TransactionSql, events: RowList<Row[]>) {
  if (events.length === 0) return;

  for (const event of events) {
    try {
      await publishEvent(event.aggregate_type, {
        id: event.id,
        aggregate_id: event.aggregate_id,
        aggregate_type: event.aggregate_type,
        sequence_number: event.sequence_number,
        payload: event.payload,
      });

      await tx`
        UPDATE outbox
        SET processed_at = NOW()
        WHERE id = ${event.id}
      `;
    } catch (err) {
      console.log(`Error when publishing event: ${err}`);
    }
  }
}
