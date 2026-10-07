"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const styles = ["Natural", "Casual", "Professional", "Academic"];

function AnalysisItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-800">
          {label}
        </span>

        <span className="text-sm text-zinc-500">
          {value}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-black"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [wordsUsed, setWordsUsed] = useState(0);
  const [plan, setPlan] = useState("free");
  const isAnonymous = user?.is_anonymous === true;
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [text, setText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Natural");
  const [result, setResult] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [mode, setMode] = useState<"humanize" | "detect">("humanize");
  const [isLoading, setIsLoading] = useState(false);
const [showUpgradeModal, setShowUpgradeModal] = useState(false);
const [showUsageModal, setShowUsageModal] = useState(false);
const [showAccountModal, setShowAccountModal] = useState(false);
const handleManageSubscription = async () => {
  try {
    const response = await fetch("/api/create-portal-session", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(
        data.error || "Unable to open subscription management."
      );
    }

    window.location.href = data.url;
  } catch (error) {
    console.error("Subscription management error:", error);
    alert("Unable to open subscription management.");
  }
};

  const wordCount = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

useEffect(() => {
async function loadUsage() {
  try {
    const response = await fetch("/api/usage");

    if (!response.ok) {
      return;
    }

const data = await response.json();
setWordsUsed(data.wordsUsed ?? 0);
setPlan(data.plan ?? "free");
  } catch (error) {
    console.error("Usage error:", error);
  }
}

loadUsage();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);

  async function handleSubmit() {
    if (!text.trim()) return;

  if (wordCount < 50) {
    setResult(
      mode === "detect"
        ? "Please enter at least 50 words to detect AI writing patterns."
        : "Please enter at least 50 words to humanize your text."
    );
    setAnalysis(null);
    return;
  }

  setResult("");
  setAnalysis(null);
  setIsLoading(true);

  try {
    const response = await fetch("/api/humanize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        style: selectedStyle,
        mode,
      }),
    });

    const data = await response.json();

if (!response.ok) {
if (response.status === 403 && mode === "humanize") {
    setShowUpgradeModal(true);
    setIsLoading(false);
    return;
  }

  setIsLoading(false);
  setResult(data.error || "Something went wrong.");
  return;
}

    setResult(data.result);

if (mode === "humanize") {
  setWordsUsed((current) => current + wordCount);
}

    setAnalysis(data.analysis);
    setIsLoading(false);
  } catch {
    setIsLoading(false);
    setResult("Something went wrong. Please try again.");
  }
}

  const score =
    mode === "detect"
      ? analysis?.overallScore ?? 0
      : analysis?.humanWritingScore ?? 0;

  /*
   * Detect AI:
   * 0% = very few AI-associated writing patterns
   * 100% = many AI-associated writing patterns
   */
  const detectScoreLabel =
    score <= 15
      ? "Very low"
      : score <= 30
      ? "Low"
      : score <= 50
      ? "Moderate"
      : score <= 70
      ? "High"
      : "Very high";

  const detectScoreColor =
    score <= 30
      ? "#16a34a"
      : score <= 50
      ? "#d97706"
      : "#ca8a04";

  const scoreColor =
    mode === "detect"
      ? detectScoreColor
      : score >= 80
      ? "#16a34a"
      : score >= 60
      ? "#d97706"
      : "#dc2626";

  const scoreLabel =
    mode === "detect"
      ? detectScoreLabel
      : score > 90
      ? "Perfect"
      : score > 80
      ? "Excellent"
      : score > 66
      ? "Very Strong"
      : score >= 60
      ? "Strong"
      : "Needs improvement";

  return (
    <main className="min-h-screen bg-[#fafaf9] text-zinc-900">

      {/* Header */}
<header className="flex items-center justify-between px-6 py-5 md:px-12">
  <div className="text-xl font-semibold tracking-tight">
    Wr1teHub<span className="text-zinc-400">.</span>
  </div>

{user && !isAnonymous ? (
  <div className="relative">
    <button
      onClick={() => setShowUserMenu(!showUserMenu)}
      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
    >
      <span>
        {user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Account"}
      </span>

      <span className="text-xs text-zinc-400">
        ▾
      </span>
    </button>

    {showUserMenu && (
      <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-zinc-900">
            {user.user_metadata?.full_name || "Account"}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {user.email}
          </p>
        </div>

        <div className="my-2 border-t border-zinc-100" />

<button
  onClick={() => {
    setShowAccountModal(true);
    setShowUserMenu(false);
  }}
  className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-600 transition hover:bg-zinc-100"
>
  Account
</button>

        <button
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-600 transition hover:bg-zinc-100"
          onClick={() => setShowUsageModal(true)}
        >
          Usage
        </button>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setShowUserMenu(false);
            setUser(null);
           }}
           className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
         >
           Log out
         </button>
      </div>
    )}
  </div>
) : (
  <div className="flex items-center gap-3">
    <button
      onClick={() => {
        window.location.href = "/auth";
      }}
      className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-black"
    >
      Log in
    </button>

    <button
      onClick={() => {
        window.location.href = "/auth";
      }}
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
    >
      Sign up
    </button>
  </div>
)}
</header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-16 text-center md:px-12 md:pt-24">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          AI humanizer & AI detector
        </p>

        <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-[-0.04em] md:text-7xl">
          Make AI writing
          <br />
          sound human.
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-500">
          Rewrite AI-generated text into natural, authentic writing while
          keeping your meaning and your voice.
        </p>
      </section>

      {/* Main Tool */}
      <section className="mx-auto max-w-4xl px-6 pb-24">

        {/* Humanize / Detect AI */}
        <div className="mb-4 flex justify-center">
          <div className="inline-flex rounded-full border border-zinc-200 bg-white p-1">

            <button
              onClick={() => {
                setMode("humanize");
                setResult("");
                setAnalysis(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                mode === "humanize"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Humanize Text
            </button>

            <button
              onClick={() => {
                setMode("detect");
                setResult("");
                setAnalysis(null);
              }}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                mode === "detect"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Detect AI
            </button>

          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">

          {/* Input */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50">

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === "detect"
                  ? "Paste your text here to check for common AI writing patterns..."
                  : "Paste your AI-generated text here..."
              }
              className="min-h-[260px] w-full resize-none bg-transparent p-6 text-base leading-7 outline-none placeholder:text-zinc-400"
            />

<div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
  <div className="flex items-center gap-4">
{mode === "humanize" ? (
  <span className="text-sm text-zinc-400">
    {wordCount.toLocaleString()} /{" "}
    {plan === "pro" ? "50,000" : "1,000"} words
  </span>
) : (
  <span className="text-sm text-zinc-400">
    Unlimited
  </span>
)}

    {wordCount > 0 && wordCount < 50 && (
      <span className="text-xs text-zinc-400">
        Minimum 50 words
      </span>
    )}
  </div>

  {mode === "humanize" && (
    <span className="text-sm text-zinc-400">
      {plan === "pro"
        ? `Monthly usage: ${Math.max(
            50000 - wordsUsed,
            0
          ).toLocaleString()} remaining`
        : `Daily usage: ${Math.max(
            1000 - wordsUsed,
            0
          ).toLocaleString()} remaining`}
    </span>
  )}
</div>

  <button
    onClick={() => {
      setText("");
      setResult("");
      setAnalysis(null);
    }}
    className="ml-6 -mt-1 text-sm text-zinc-400 transition hover:text-zinc-900"
  >
    Clear
  </button>
</div>
          </div>


          {/* Style */}
          {mode === "humanize" && (
            <div className="mt-6">

              <p className="mb-3 text-sm font-medium">
                How should it sound?
              </p>

              <div className="flex flex-wrap gap-2">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedStyle === style
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

            </div>
          )}

          {/* Main Button */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || wordCount < 50}
            className="mt-6 w-full rounded-2xl bg-zinc-900 py-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {isLoading
              ? mode === "detect"
                  ? "Detecting..."
                   : "✨ Humanizing..."
                 : mode === "detect"
                 ? "Detect AI"
                 : "✨ Humanize"}
          </button>

          {/* Result */}
          {result && (
            <>
              {mode === "humanize" ? (
                <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">

                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      Your humanized text
                    </p>

                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(result)
                      }
                      className="text-sm text-zinc-500 transition hover:text-zinc-900"
                    >
                      Copy
                    </button>
                  </div>

                  <p className="whitespace-pre-wrap text-base leading-7 text-zinc-700">
                    {result}
                  </p>

                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">

                  <h2 className="text-xl font-semibold">
                    AI Detector
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Common patterns often associated with AI-generated writing.
                  </p>

                </div>
              )}

              {/* AI Detection Analysis */}
              {mode === "detect" && analysis && (
                <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">

                  <div className="mb-8">
                    <h2 className="text-xl font-semibold">
                      {mode === "detect"
                        ? "AI Writing Indicators"
                        : "General Writing Analysis"}
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      {mode === "detect"
                        ? "This analysis looks at writing characteristics commonly associated with AI-generated text."
                        : "A closer look at your writing style, clarity, and overall readability."}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="mb-10 flex flex-col items-center">

                    <div className="relative h-36 w-36">

                      {/* Proportional circle */}
                      <div
                        className="relative h-36 w-36 rounded-full"
                        style={{
                          background:
                            mode === "detect"
                              ? `conic-gradient(#eab308 ${score}%, #16a34a ${score}% 100%)`
                              : `conic-gradient(${scoreColor} ${score}%, #e4e4e7 ${score}% 100%)`,
                        }}
                      >
                        <div className="absolute inset-[8px] flex flex-col items-center justify-center rounded-full bg-white">

                          <span
                            className="text-3xl font-semibold"
                            style={{
                             color: mode === "detect" ? "#eab308" : scoreColor,
                            }}
                          >
                            {score}%
                          </span>

                          <span className="text-center text-[11px] leading-tight text-zinc-500">
                            {mode === "detect" ? (
                              <>
                                AI Pattern
                                <br />
                                Score
                              </>
                            ) : (
                              <>
                                Overall
                                <br />
                                Writing Score
                              </>
                            )}
                          </span>

                        </div>
                      </div>

                    </div>

                    <p
                      className="mt-4 text-sm font-medium"
                      style={{ color: scoreColor }}
                    >
                      {scoreLabel}
                    </p>

                  </div>

                  {/* Indicators */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <AnalysisItem
                      label={
                        mode === "detect"
                          ? "Sentence Structure"
                          : "Sentence Variation"
                      }
                      value={
                        mode === "detect"
                          ? analysis.sentenceStructure
                          : analysis.sentenceVariation
                      }
                    />

                    <AnalysisItem
                      label="Repetition"
                      value={analysis.repetition}
                    />

                    <AnalysisItem
                      label="Generic Phrasing"
                      value={analysis.genericPhrasing}
                    />

                    <AnalysisItem
                      label="Natural Flow"
                      value={analysis.naturalFlow}
                    />

                    <AnalysisItem
                      label="Personal Voice"
                      value={analysis.personalVoice}
                    />

                    <AnalysisItem
                      label="Concrete Language"
                      value={analysis.concreteLanguage}
                    />

                    <AnalysisItem
                      label="Vocabulary Simplicity"
                      value={analysis.vocabularySimplicity}
                    />

                    <AnalysisItem
                      label="Formality"
                      value={analysis.formality}
                    />

                    <AnalysisItem
                      label="Sentence Rhythm"
                      value={analysis.sentenceRhythm}
                    /><p className="mt-6 text-center text-sm text-zinc-400">
  Free to use. No credit card required.
</p>



                  </div>

                  {/* Disclaimer */}
                  {mode === "detect" && (
                    <p className="mt-8 text-center text-xs leading-5 text-zinc-400">
                      This analysis identifies writing patterns commonly
                      associated with AI-generated text. It is not a definitive
                      determination of AI authorship.
                    </p>
                  )}

                </div>
              )}

            </>
          )}

        </section>
        
        {/* Upgrade Modal */}
{showUpgradeModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Upgrade to Pro
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Get more words and unlock the full Wr1teHub experience.
          </p>
        </div>

        <button
          onClick={() => setShowUpgradeModal(false)}
          className="text-2xl leading-none text-zinc-400 transition hover:text-zinc-900"
        >
          ×
        </button>
      </div>

      <div className="mt-8 rounded-2xl bg-zinc-50 p-6">
        <p className="text-sm text-zinc-500">
          Wr1teHub Pro
        </p>

        <p className="mt-2 text-3xl font-semibold text-zinc-900">
          $9.99
          <span className="text-base font-normal text-zinc-500">
            {" "}
            / month
          </span>
        </p>

        <ul className="mt-5 space-y-3 text-sm text-zinc-600">
          <li>✓ 50,000 words per month</li>
          <li>✓ Unlimited AI Detector</li>
          <li>✓ Cancel anytime</li>
        </ul>
      </div>

      <button
        onClick={async () => {
          try {
            const response = await fetch(
              "/api/create-checkout-session",
              {
                method: "POST",
              }
            );

            const data = await response.json();

            if (!response.ok || !data.url) {
              throw new Error(
                data.error || "Unable to start checkout."
              );
            }

            window.location.href = data.url;
          } catch (error) {
            console.error("Checkout error:", error);
            alert("Unable to start checkout. Please try again.");
          }
        }}
        className="mt-6 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        Continue to Checkout
      </button>

    </div>
  </div>
)}

        {/* Upgrade Modal */}
{/* Usage Modal */}
{showUsageModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Your Usage
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {plan === "pro" ? "Wr1teHub Pro" : "Free Plan"}
          </p>
        </div>

        <button
          onClick={() => setShowUsageModal(false)}
          className="text-2xl leading-none text-zinc-400 transition hover:text-zinc-900"
        >
          ×
        </button>
      </div>

      <div className="mt-8 rounded-2xl bg-zinc-50 p-6">

        {plan === "pro" ? (
          <>
            <p className="text-sm text-zinc-500">
              Monthly limit
            </p>

            <p className="mt-2 text-3xl font-semibold text-zinc-900">
              50,000 words
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              per month
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-500">
              Daily usage
            </p>

            <p className="mt-2 text-3xl font-semibold text-zinc-900">
              {wordsUsed.toLocaleString()} / 1,000
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              {Math.max(1000 - wordsUsed, 0).toLocaleString()} words remaining today
            </p>
          </>
        )}

      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600">
            AI Detector
          </span>

          <span className="text-sm font-medium text-zinc-900">
            Unlimited
          </span>
        </div>
      </div>
            {plan === "pro" && (
        <button
          onClick={handleManageSubscription}
          className="mt-4 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Manage Subscription
        </button>
      )}

      {plan === "free" && (
        <button
          onClick={() => {
            setShowUsageModal(false);
            setShowUpgradeModal(true);
          }}
          className="mt-6 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Upgrade to Pro
        </button>
      )}

    </div>
  </div>
)}

{/* Account Modal */}
{showAccountModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Account
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Manage your Wr1teHub account
          </p>
        </div>

        <button
          onClick={() => setShowAccountModal(false)}
          className="text-2xl leading-none text-zinc-400 transition hover:text-zinc-900"
        >
          ×
        </button>
      </div>

      <div className="mt-8 space-y-4">

        <div className="rounded-2xl bg-zinc-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Email
          </p>

          <p className="mt-2 text-sm text-zinc-900">
            {user?.email}
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Plan
          </p>

          <p className="mt-2 text-sm font-medium text-zinc-900">
            {plan === "pro" ? "Wr1teHub Pro" : "Free Plan"}
          </p>
        </div>

      </div>

      {plan === "free" && (
        <button
          onClick={() => {
            setShowAccountModal(false);
            setShowUpgradeModal(true);
          }}
          className="mt-6 w-full rounded-2xl bg-zinc-900 py-3 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Upgrade to Pro
        </button>
      )}

    </div>
  </div>
)}

        {/* Bottom text */}
        <p className="mt-6 text-center text-sm text-zinc-400"></p>
        {/* Bottom text */}
        <p className="mt-6 text-center text-sm text-zinc-400">
          Free to use. No credit card required.
        </p>

<footer className="mt-10 pb-6 text-center text-sm text-zinc-400">
  <div className="flex justify-center gap-5 flex-wrap">
    <a href="/terms" className="hover:text-zinc-900 transition">
      Terms of Service
    </a>

    <a href="/privacy" className="hover:text-zinc-900 transition">
      Privacy Policy
    </a>

    <a href="/refund-policy" className="hover:text-zinc-900 transition">
      Refund & Cancellation Policy
    </a>
  </div>

  <p className="mt-3">
    © 2026 Wr1teHub. All rights reserved.
  </p>
</footer>

</main>
);
}