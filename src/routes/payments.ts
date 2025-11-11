import { FastifyInstance } from "fastify";
import { authGuard } from "../services/authGuard";
import { cancelOrder, createOrder, updatePaymentFailure, verifyPayment } from "../controllers/payments";
import { required } from "zod/v4-mini";

export default async function paymentsRoutes(app: FastifyInstance) {
  app.post(
    "/create-order",
    {
      schema: {
        body: {
          type: "object",
          required: ["application_id"],
          properties: {
            application_id: { type: "string", format: "uuid" },
          },
        },
      },
      preHandler: [authGuard],
    },
    createOrder
  );

  app.post(
    "/verify-payment",
    {
      schema: {
        body: {
          type: "object",
          required: [
            "razorpay_payment_id",
            "razorpay_order_id",
            "razorpay_signature",
          ],
          properties: {
            razorpay_payment_id: { type: "string" },
            razorpay_order_id: { type: "string" },
            razorpay_signature: { type: "string" },
          },
        },
      },
      preHandler: [authGuard],
    },
    verifyPayment
  );

  app.post(
    "/update-payment-failure",
    {
      schema: {
        body: {
          type: "object",
          required: ["order_id", "provider_order_id", "provider_payment_id"],
          properties: {
            order_id: { type: "string" },
            provider_order_id: { type: "string" },
            provider_payment_id: { type: "string" },
            reason: { type: "string", default: null },
          },
        },
      },
      preHandler: [authGuard],
    },
    updatePaymentFailure
  );

  app.post(
    "/cancel-order",
    {
      schema: {
        body: {
          type: "object",
          required: ["order_id", "provider_order_id"],
          properties: {
            order_id: { type: "string" },
            provider_order_id: { type: "string"},
          },
        },
      },
      preHandler: [authGuard],
    },
    cancelOrder
  );

}
