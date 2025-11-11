import { FastifyReply, FastifyRequest } from "fastify";
import crypto from "crypto";
import { prisma } from "../db/client";
import { env } from "../config/env";
import razorpay from "../services/razorpay";


const ORD_STATUS = {
  CREATED: "Created",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
  COMPLETED: "Paid",
} as const;


// ───────────────────────────────────────────────────────────────────────────────
// 1) CREATE ORDER
// ───────────────────────────────────────────────────────────────────────────────
export const createOrder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: "Unauthorized" });

    const dbUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true },
    });
    if (!dbUser) return reply.status(401).send({ error: "Unauthorized" });

    const { application_id } = request.body as {
      application_id: string; // applied_colleges.ref_id (UUID)
    };
    if (!application_id) {
      return reply.status(400).send({ success: false, message: "application_id is required" });
    }

    const app = await prisma.applied_colleges.findFirst({
      where: { ref_id: application_id, user_id: dbUser.id, is_active: true },
      select: { id: true, amount: true, ready_to_pay: true, paid: true, paid_at: true },
    });
    if (!app?.id) return reply.status(404).send({ success: false, message: "Application not found" });

    const readyToPay = app.ready_to_pay === true;
    const notPaid = app.paid === false && app.paid_at == null;
    if (!readyToPay || !notPaid) {
      return reply
        .status(400)
        .send({ success: false, message: "Application not ready for payment or already paid" });
    }

    const amount = Number(app.amount ?? 0);
    if (!amount || amount <= 0) {
      return reply.status(400).send({ success: false, message: "Invalid application amount" });
    }

    // Create Razorpay order
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: true,
    });
    if (!rpOrder?.id) {
      return reply.status(500).send({ success: false, message: "Order creation failed (Razorpay)" });
    }

    // Persist order
    const order = await prisma.orders.create({
      data: {
        user_id: dbUser.id,
        application_id,                    // ties to applied_colleges.ref_id (UUID string)
        provider: "RazorPay" as any,       // payment_provider enum
        provider_order_id: rpOrder.id,
        amount: app.amount!,               // Decimal
        currency: "INR" ,         // currency_type enum (INR default)
        status: ORD_STATUS.CREATED as any, // order_status_type
        receipt_no: rpOrder.receipt ?? null,
        meta: rpOrder as any,
      },
      select: {
        id: true,
        provider_order_id: true,
        amount: true,
        currency: true,
        status: true,
      },
    });

    return reply.send({
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        provider_order_id: order.provider_order_id,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        status: order.status,
      },
    });
  } catch (e: any) {
    request.log.error({ err: e }, "createOrder error");
    return reply.status(500).send({ success: false, message: e?.message || "Internal Server Error" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// 2) CANCEL ORDER
// ───────────────────────────────────────────────────────────────────────────────
export const cancelOrder = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: "Unauthorized" });

    const dbUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true },
    });
    if (!dbUser) return reply.status(401).send({ error: "Unauthorized" });

    const { order_id, provider_order_id } = request.body as {
      order_id: string; // orders.id (UUID)
      provider_order_id: string; // Razorpay order id
    };
    if (!order_id || !provider_order_id) {
      return reply.status(400).send({ success: false, message: "Invalid order details" });
    }

    const order = await prisma.orders.findFirst({
      where: {
        id: order_id,
        provider_order_id,
        user_id: dbUser.id,
        NOT: { status: ORD_STATUS.COMPLETED as any },
      },
      select: { id: true, status: true },
    });
    if (!order?.id) return reply.status(404).send({ success: false, message: "Order not found" });

    if (order.status === ORD_STATUS.CREATED) {
      await prisma.orders.update({
        where: { id: order_id },
        data: { status: ORD_STATUS.CANCELLED as any },
      });
    }

    return reply.send({ success: true, message: "Order canceled successfully" });
  } catch (e: any) {
    request.log.error({ err: e }, "cancelOrder error");
    return reply.status(500).send({ success: false, message: e?.message || "Internal Server Error" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// 3) UPDATE PAYMENT FAILURE
// ───────────────────────────────────────────────────────────────────────────────
export const updatePaymentFailure = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: "Unauthorized" });

    const dbUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true },
    });
    if (!dbUser) return reply.status(401).send({ error: "Unauthorized" });

    const { order_id, provider_order_id, provider_payment_id, reason } = request.body as {
      order_id: string;
      provider_order_id: string;
      provider_payment_id: string;
      reason?: string | null;
    };
    if (!order_id || !provider_order_id || !provider_payment_id) {
      return reply.status(400).send({ success: false, message: "Invalid order details" });
    }

    const order = await prisma.orders.findFirst({
      where: {
        id: order_id,
        provider_order_id,
        user_id: dbUser.id,
        NOT: { status: ORD_STATUS.COMPLETED as any },
      },
      select: { id: true, amount: true, currency: true },
    });
    if (!order?.id) return reply.status(404).send({ success: false, message: "Order not found" });

    // No compound unique on (order_id, provider_payment_id) in your schema,
    // so do a findFirst + create/update inside a transaction.
    await prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: order_id },
        data: { status: ORD_STATUS.FAILED as any },
      });

      const existing = await tx.payments.findFirst({
        where: { order_id, provider_payment_id },
        select: { id: true },
      });

      if (existing) {
        await tx.payments.update({
          where: { id: existing.id },
          data: {
            status: false,
            failure_reason: reason ?? null,
            amount: order.amount,
            currency: order.currency,
            updated_at: new Date(),
          },
        });
      } else {
        await tx.payments.create({
          data: {
            order_id,
            provider_payment_id,
            verification_signature: "",
            amount: order.amount,
            currency: order.currency,
            status: false,
            method: null,
            captured_at: null,
            failure_reason: reason ?? null,
          },
        });
      }
    });

    return reply.send({ success: true, message: "Payment failure recorded" });
  } catch (e: any) {
    request.log.error({ err: e }, "updatePaymentFailure error");
    return reply.status(500).send({ success: false, message: e?.message || "Internal Server Error" });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// 4) VERIFY PAYMENT
// ───────────────────────────────────────────────────────────────────────────────
export const verifyPayment = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) return reply.status(401).send({ error: "Unauthorized" });

    const dbUser = await prisma.users.findUnique({
      where: { ref_id: user.sub },
      select: { id: true, email: true },
    });
    if (!dbUser) return reply.status(401).send({ error: "Unauthorized" });

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = request.body as {
      razorpay_payment_id: string;
      razorpay_order_id: string; // equals orders.provider_order_id
      razorpay_signature: string;
    };
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return reply.status(400).send({ success: false, message: "Invalid payment payload" });
    }

    const order = await prisma.orders.findFirst({
      where: {
        provider_order_id: razorpay_order_id,
        user_id: dbUser.id,
        status: { in: [ORD_STATUS.CREATED as any, ORD_STATUS.FAILED as any] },
      },
      select: { id: true, amount: true, currency: true, application_id: true },
    });
    if (!order?.id) return reply.status(404).send({ success: false, message: "Order not found" });

    // Razorpay order check
    const rpOrder = await razorpay.orders.fetch(razorpay_order_id);
    const expectedAmount = Math.round(Number(order.amount) * 100);
    if (rpOrder?.amount !== expectedAmount) {
      return reply.status(400).send({ success: false, message: "Order amount mismatch" });
    }

    // Signature verification
    const computedSig = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (computedSig !== razorpay_signature) {
      return reply.status(400).send({ success: false, message: "Payment signature mismatch" });
    }

    // Payment captured?
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment?.status !== "captured") {
      return reply.status(400).send({ success: false, message: "Payment not captured" });
    }

    const now = new Date();
    const application = await prisma.applied_colleges.findFirst({
      where: { ref_id: order.application_id ?? "" },
      select: { id: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: order.id },
        data: { status: ORD_STATUS.COMPLETED as any, updated_at: now },
      });

      await tx.payments.create({
        data: {
          order_id: order.id,
          provider_payment_id: razorpay_payment_id,
          verification_signature: razorpay_signature,
          amount: order.amount,
          currency: order.currency,
          status: true,
          method: (payment as any)?.method ?? null,
          captured_at: now,
          meta: payment as any,
        },
      });

      if (application?.id) {
        await tx.applied_colleges.update({
          where: { id: application.id },
          data: { paid: true, paid_at: now, updated_at: now },
        });
      }
    });

    return reply.send({ success: true, message: "Payment verified" });
  } catch (e: any) {
    request.log.error({ err: e }, "verifyPayment error");
    return reply.status(500).send({ success: false, message: e?.message || "Internal Server Error" });
  }
};
