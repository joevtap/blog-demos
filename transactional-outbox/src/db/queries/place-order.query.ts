import { randomUUID } from "node:crypto";
import type { TransactionSql } from "postgres";

interface PlaceOrderProps {
  userId: number;
  productId: number;
  amount: number;
}

export async function placeOrder(tx: TransactionSql, props: PlaceOrderProps) {
  const { userId, productId, amount } = props;

  await tx`INSERT INTO orders (
          user_id,
          product_id,
          amount
        ) VALUES (
          ${userId},
          ${productId},
          ${amount}
        )`;

  const [{ nextSeq }] = await tx`
      SELECT COALESCE(MAX(sequence_num), 0) + 1 as nextSeq 
    FROM outbox 
    WHERE entity_id = ${request.body.userId.toString()}`;

  await tx`INSERT INTO outbox (
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
}
