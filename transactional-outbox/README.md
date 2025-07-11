# Transactional Outbox Pattern Demo

This source code accompanies the blog post: https://blog.joevtap.com/posts/transactional-outbox

## Running

You only need Docker installed.

Run the following command to start the orders service, database, broker, and Debezium:

```bash
docker compose up --build
```

In the `docker-compose.yaml` file, you can change the `STRATEGY` environment variable for the orders service to `polling` if you want to test the Polling Publisher implementation.

If you have Node.js installed on your system, you can run the `test-order-endpoint.js` script to make requests to the exposed orders service endpoint.
