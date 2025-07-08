import { sql } from "./db/db.js";

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "10", 10);
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "1000", 10);

export async function pollingPublisher() {
  while (true) {
    try {
      await sql.begin(async (tx) => {
        const events = await tx`
          SELECT id, aggregate_id, aggregate_type, payload, sequence_number
          FROM outbox
          WHERE processed_at IS NULL
          ORDER BY created_at
          LIMIT ${BATCH_SIZE}
          FOR UPDATE SKIP LOCKED
        `;

        if (events.length === 0) return;

        for (const event of events) {
          console.log("Publishing event:", {
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
        }
      });
    } catch (err) {
      console.error("Polling publisher error:", err);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}
