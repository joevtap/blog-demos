import "./http/server.js";
import { pollingPublisher } from "./polling-publisher.js";

if (!process.env.STRATEGY) {
  throw new Error("STRATEGY environment variable is missing");
}

const strategy = process.env.STRATEGY;

switch (strategy) {
  case "logtailing":
    console.log("Log Tailing strategy selected, start Debezium container");
    break;
  case "polling":
    pollingPublisher().catch(console.error);
    break;
  default:
    pollingPublisher().catch(console.error);
}
