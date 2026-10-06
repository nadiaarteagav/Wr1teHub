import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing Stripe signature", {
      status: 400,
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    const supabase = createAdminClient();

    // ----------------------------------------
    // SUBSCRIPTION CREATED / CHECKOUT COMPLETED
    // ----------------------------------------
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ plan: "pro" })
          .eq("id", userId);

        if (error) {
          console.error("Supabase plan update error:", error);

          return new NextResponse("Database update failed", {
            status: 500,
          });
        }

        console.log(`User ${userId} upgraded to Pro.`);
      }
    }

    // ----------------------------------------
    // SUBSCRIPTION UPDATED
    // ----------------------------------------
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.userId;

      if (userId) {
        const activeStatuses = ["active", "trialing"];

        const plan = activeStatuses.includes(subscription.status)
          ? "pro"
          : "free";

        const { error } = await supabase
          .from("profiles")
          .update({ plan })
          .eq("id", userId);

        if (error) {
          console.error(
            "Supabase subscription update error:",
            error
          );

          return new NextResponse("Database update failed", {
            status: 500,
          });
        }

        console.log(
          `User ${userId} subscription status: ${subscription.status}. Plan: ${plan}`
        );
      }
    }

    // ----------------------------------------
    // SUBSCRIPTION DELETED / ENDED
    // ----------------------------------------
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.userId;

      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ plan: "free" })
          .eq("id", userId);

        if (error) {
          console.error(
            "Supabase subscription cancellation error:",
            error
          );

          return new NextResponse("Database update failed", {
            status: 500,
          });
        }

        console.log(`User ${userId} downgraded to Free.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return new NextResponse("Webhook Error", {
      status: 400,
    });
  }
}