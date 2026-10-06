import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const DAILY_WORD_LIMIT = 1000;

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

if (profile.plan === "pro") {
  const monthStart = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      1
    )
  )
    .toISOString()
    .split("T")[0];

  const { data: monthlyUsage, error: monthlyUsageError } =
    await supabase
      .from("monthly_usage")
      .select("words_used")
      .eq("user_id", user.id)
      .eq("usage_month", monthStart)
      .maybeSingle();

  if (monthlyUsageError) {
    return NextResponse.json(
      { error: monthlyUsageError.message },
      { status: 500 }
    );
  }

  const wordsUsed = monthlyUsage?.words_used ?? 0;
  const wordsRemaining = Math.max(50000 - wordsUsed, 0);

  return NextResponse.json({
    plan: "pro",
    wordsUsed,
    wordsRemaining,
    dailyLimit: null,
    monthlyLimit: 50000,
  });
}

  const today = new Date().toISOString().split("T")[0];

  const { data: usage, error: usageError } = await supabase
    .from("daily_usage")
    .select("words_used")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();

  if (usageError) {
    return NextResponse.json(
      { error: usageError.message },
      { status: 500 }
    );
  }

  const wordsUsed = usage?.words_used ?? 0;
  const wordsRemaining = Math.max(DAILY_WORD_LIMIT - wordsUsed, 0);

  return NextResponse.json({
    plan: "free",
    wordsUsed,
    wordsRemaining,
    dailyLimit: DAILY_WORD_LIMIT,
  });
}