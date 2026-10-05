import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: "price_1UN3h9Ra1TZfaPKz67NY1Jyu",
          quantity: 1,
        },
      ],

      success_url: `${request.headers.get("origin")}/?checkout=success`,
      cancel_url: `${request.headers.get("origin")}/?checkout=cancelled`,

      metadata: {
        userId,
      },

      subscription_data: {
        metadata: {
          userId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      { error: "Unable to create checkout session." },
      { status: 500 }
    );
  }
}