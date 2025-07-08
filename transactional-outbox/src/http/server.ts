import Fastify from "fastify";

import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { z } from "zod/v4";
import { sql } from "../db/db.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { placeOrder } from "../db/queries/place-order.query.js";

const app = Fastify();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/orders/place",
  schema: {
    body: z.object({
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
      await sql.begin(async (tx) => {
        await placeOrder(tx, request.body);
        reply.send({ message: "order placed" });
      });
    } catch (error) {
      console.log(error);
      reply.status(500).send({ error: "internal server error" });
    }
  },
});

app.listen({ port: 8080, host: "0.0.0.0" }, () => {
  console.log("Listening on port :8080");
});
