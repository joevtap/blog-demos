import {
  jetstream,
  JetStreamClient,
  JetStreamManager,
  jetstreamManager,
} from "@nats-io/jetstream";
import { connect, NatsConnection } from "@nats-io/transport-node";

let nc: NatsConnection;
let js: JetStreamClient;
let jsm: JetStreamManager;

async function ensureConnected() {
  if (!nc || nc.isClosed()) {
    nc = await connect({
      reconnectJitter: 100,
      reconnectTimeWait: 1000,
    });

    jsm = await jetstreamManager(nc);
    js = jetstream(nc);

    await jsm.streams.add({
      name: "PollingStream",
      subjects: ["polling.outbox.>"],
    });
  }
}

export async function publishEvent(
  aggregate: string,
  event: Record<string, any>
) {
  await ensureConnected();
  await js.publish(`polling.outbox.event.${aggregate}`, JSON.stringify(event), {
    retries: 2,
    timeout: 1000,
  });
}
