import { sql } from "../db.js";
import type { TransactionSql } from "postgres";

interface PlaceOrderProps {
  productId: number;
  amount: number;
}

export async function placeOrder(tx: TransactionSql, props: PlaceOrderProps) {
  const { productId, amount } = props;

  const [{ id: aggregateId }] = await tx`INSERT INTO orders (
    product_id,
    amount
  ) VALUES (
    ${productId},
    ${amount}
  ) RETURNING id`;

  await tx`SELECT 1 FROM outbox WHERE aggregate_id = ${aggregateId} FOR UPDATE`;

  const [{ max }] = await tx`
    SELECT COALESCE(MAX(sequence_number), 0) AS max
    FROM outbox
    WHERE aggregate_id = ${aggregateId}
  `;

  const nextSequenceNumber = Number(max) + 1;

  await tx`INSERT INTO outbox (
    aggregate_id,
    aggregate_type,
    payload,
    sequence_number
  ) VALUES (
    ${aggregateId},
    'order',
    ${sql.json({
      type: "ORDER_PLACED",
      aggregateId,
      aggregateType: "order",
      sequenceNumber: nextSequenceNumber,
      productId,
      amount,
    })},
    ${nextSequenceNumber}
  )`;
}
