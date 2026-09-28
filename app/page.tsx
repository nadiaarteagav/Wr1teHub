"use client";

import { useState } from "react";

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
  const [text, setText] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Natural");
  const [result, setResult] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  const wordCount = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  async function handleHumanize() {
    if (!text.trim()) return;

    setResult("Humanizing...");
    setAnalysis(null);

    try {
      const response = await fetch("/api/humanize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          style: selectedStyle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult(data.error || "Something went wrong.");
        return;
      }

      setResult(data.result);
      setAnalysis(data.analysis);
    } catch {
      setResult("Something went wrong. Please try again.");
    }
  }

  const score = analysis?.humanWritingScore ?? 0;

  const scoreColor =
    score >= 80
      ? "#16a34a"
      : score >= 60
      ? "#d97706"
      : "#dc2626";

const scoreLabel =
  score > 90
    ? "Perfect"
    : score > 80
    ? "Excellent"
    : score > 66
    ? "Very Strong"
    : score >= 60
    ? "Strong"
    : "Needs improvement";

  const circumference = 2 * Math.PI * 54;
  const offset =
    circumference - (score / 100) * circumference;

  return (
    <main className="min-h-screen bg-[#fafaf9] text-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 md:px-12">
        <div className="text-xl font-semibold tracking-tight">
          Wr1teHub<span className="text-zinc-400">.</span>
        </div>

        <div className="text-sm text-zinc-500">
          Free to use
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-16 text-center md:px-12 md:pt-24">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          AI writing, made natural
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
        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">

          {/* Input */}
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your AI-generated text here..."
              className="min-h-[260px] w-full resize-none bg-transparent p-6 text-base leading-7 outline-none placeholder:text-zinc-400"
            />

            <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
              <span className="text-sm text-zinc-400">
                {wordCount.toLocaleString()} / 1,000 words
              </span>

              <button
                onClick={() => {
                  setText("");
                  setResult("");
                  setAnalysis(null);
                }}
                className="text-sm text-zinc-400 transition hover:text-zinc-900"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Style */}
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

          {/* Button */}
          <button
            onClick={handleHumanize}
            disabled={!text.trim()}
            className="mt-6 w-full rounded-2xl bg-zinc-900 py-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            ✨ Humanize
          </button>

          {/* Result */}
          {result && (
            <>
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

              {/* Writing Analysis */}
              {analysis && (
                <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">

                  <div className="mb-8">
                    <h2 className="text-xl font-semibold">
                      General Writing Analysis
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      A closer look at your writing style, clarity, and overall readability.
                    </p>
                  </div>

                  {/* Score */}
                  <div className="mb-10 flex flex-col items-center">

                    <div className="relative h-36 w-36">

                      <svg
                        className="h-36 w-36 -rotate-90"
                        viewBox="0 0 120 120"
                      >
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="#e4e4e7"
                          strokeWidth="8"
                        />

                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke={scoreColor}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                        />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className="text-3xl font-semibold"
                          style={{ color: scoreColor }}
                        >
                          {score}%
                        </span>

                        <span className="text-[11px] leading-tight text-center text-zinc-500">
                          Overall<br />
                          Writing Score
                        </span>
                      </div>

                    </div>

                    <p
                      className="mt-4 text-sm font-medium"
                      style={{ color: scoreColor }}
                    >
                      {scoreLabel}
                    </p>

                  </div>

                  {/* Individual Indicators */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <AnalysisItem
                      label="Sentence Variation"
                      value={analysis.sentenceVariation}
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
                    />

                  </div>

                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom text */}
        <p className="mt-6 text-center text-sm text-zinc-400">
          Free to use. No credit card required.
        </p>
      </section>
    </main>
  );
}