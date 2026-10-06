import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "No email found for this account." },
        { status: 400 }
      );
    }

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    const customer = customers.data[0];

    if (!customer) {
      return NextResponse.json(
        { error: "No Stripe customer found." },
        { status: 404 }
      );
    }

    const origin =
      request.headers.get("origin") || "https://wr1tehub.com";

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: origin,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);

    return NextResponse.json(
      { error: "Unable to open subscription management." },
      { status: 500 }
    );
  }
}