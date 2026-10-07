"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setMessage("Please enter your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsLoading(false);
      return;
    }

    setMessage("Your password has been updated successfully.");

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-900 flex items-center justify-center px-6">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-semibold tracking-tight"
          >
            Wr1teHub
          </button>

          <h1 className="mt-8 text-3xl font-semibold">
            Create a new password
          </h1>

          <p className="mt-2 text-zinc-500">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-2">
              New password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm new password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400"
            />
          </div>

          {message && (
            <div className="rounded-xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-3 text-white font-medium transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {isLoading ? "Please wait..." : "Reset password"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          <button
            onClick={() => router.push("/auth")}
            className="font-medium text-zinc-900 hover:underline"
          >
            Back to login
          </button>
        </div>

      </div>
    </main>
  );
}