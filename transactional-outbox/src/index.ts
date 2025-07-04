import { sql } from "./db/db.js";
import "./http/server.js";

async function listenDbChanges() {
  await sql.subscribe("insert:outbox", (row, info) => {
    console.log(row);
  });
}

listenDbChanges().catch(console.error);
