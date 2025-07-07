import { sql } from "./db/db.js";

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || "10", 10);
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "1000", 10);

export async function pollingPublisher() {
  const processBatch = async () => {
    await sql.begin(async (tx) => {
      // Step 1: Identify the next sequence numbers for each entity
      const nextSequences = await tx`
        SELECT entity_id, MIN(sequence_number) as next_seq
        FROM outbox 
        WHERE processed_at IS NULL
        GROUP BY entity_id
      `;

      if (nextSequences.length === 0) {
        console.log("No events to process");
        return;
      }

      // Step 2: Fetch the events to process using the identified sequence numbers
      const events = await tx`
        SELECT o.id, o.event_type, o.payload, o.entity_id, o.sequence_number, o.created_at
        FROM outbox o
        JOIN (
          SELECT entity_id, MIN(sequence_number) as next_seq
          FROM outbox 
          WHERE processed_at IS NULL
          GROUP BY entity_id
        ) ns ON o.entity_id = ns.entity_id AND o.sequence_number = ns.next_seq
        WHERE o.processed_at IS NULL
        ORDER BY o.created_at
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `;

      if (events.length === 0) {
        console.log("No events to process");
        return;
      }

      console.log(`Processing batch of ${events.length} events`);

      for (const event of events) {
        try {
          console.log(
            `Processing event ${event.id} (seq: ${event.sequence_number}) for entity ${event.entity_id}`
          );
          // Simulate publishing logic here
        } catch (error) {
          console.error(`Failed to process event ${event.id}:`, error);
          continue; // Skip failed events
        }
      }

      const idsToUpdate = events.map((event) => event.id);
      await tx`
        UPDATE outbox 
        SET processed_at = NOW() 
        WHERE id = ANY(${idsToUpdate})
      `;

      console.log(`Batch of ${events.length} events processed successfully`);
    });
  };

  console.log(
    `Starting polling publisher with ${POLL_INTERVAL}ms interval, batch size: ${BATCH_SIZE}`
  );

  setInterval(async () => {
    try {
      await processBatch();
    } catch (error) {
      console.error("Polling batch processing failed:", error);
    }
  }, POLL_INTERVAL);

  await processBatch();
}
