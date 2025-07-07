import "./http/server.js";
import { pollingPublisher } from "./polling-publisher.js";
import { postgresJsSubscribe } from "./using-postgresjs-subscribe.js";

if (!process.env.STRATEGY) {
  throw new Error("STRATEGY environment variable is missing");
}

const strategy: string = process.env.STRATEGY;

switch (strategy) {
  case "subscribe":
    postgresJsSubscribe().catch(console.error);
    break;
  case "polling":
    pollingPublisher().catch(console.error);
    break;
  default:
    pollingPublisher().catch(console.error);
}
