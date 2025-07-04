import Fastify from "fastify";

import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { z } from "zod/v4";
import { sql } from "../db/db.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { randomUUID } from "node:crypto";

const app = Fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/orders/place",
  schema: {
    body: z.object({
      userId: z.number().int(),
      productId: z.number().int(),
      amount: z.number().int(),
    }),
    response: {
      201: z.object({
        message: z.string(),
      }),
      500: z.object({
        error: z.string(),
      }),
    },
  },
  handler: async (request, reply) => {
    try {
      await sql.begin(async (sql) => {
        const { userId, productId, amount } = request.body;

        await sql`INSERT INTO orders (
          user_id,
          product_id,
          amount
        ) VALUES (
          ${userId},
          ${productId},
          ${amount}
        )`;

        await sql`INSERT INTO outbox (
          key,
          event_type,
          payload
        ) VALUES (
          ${randomUUID()},
          ${"order-placed"},
          ${JSON.stringify({
            userId,
            productId,
            amount,
            timestamp: new Date().toISOString(),
          })}
        )`;

        reply.send({
          message: "order placed",
        });
      });
    } catch (error) {
      console.error("Database error:", error);
      reply.status(500).send({ error: "database error" });
    }
  },
});

app.listen({ port: 8080, host: "0.0.0.0" }, () => {
  console.log("Listening on port :8080");
});
