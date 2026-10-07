"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setMessage("Please enter your email.");
      return;
    }

    if (!isForgotPassword && !password) {
      setMessage("Please enter your password.");
      return;
    }

    if (!isLogin && !isForgotPassword && !name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    // Forgot password
    if (isForgotPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Check your email for a password reset link."
        );
      }

      setIsLoading(false);
      return;
    }

    // Login
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    }

    // Sign up
    else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setMessage(
          "Check your email to confirm your account, then log in."
        );
        setIsLoading(false);
      }
    }
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
            {isForgotPassword
              ? "Reset your password"
              : isLogin
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p className="mt-2 text-zinc-500">
            {isForgotPassword
              ? "Enter your email and we'll send you a password reset link."
              : isLogin
              ? "Log in to continue to Wr1teHub."
              : "Create an account to get started."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {!isLogin && !isForgotPassword && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400"
              />
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(true);
                  setMessage("");
                }}
                className="text-sm text-zinc-500 hover:text-zinc-900 hover:underline"
              >
                Forgot your password?
              </button>
            </div>
          )}

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
            {isLoading
              ? "Please wait..."
              : isForgotPassword
              ? "Send reset link"
              : isLogin
              ? "Log in"
              : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500">
          {isForgotPassword ? (
            <button
              onClick={() => {
                setIsForgotPassword(false);
                setMessage("");
              }}
              className="font-medium text-zinc-900 hover:underline"
            >
              Back to login
            </button>
          ) : (
            <>
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}

              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
                className="font-medium text-zinc-900 hover:underline"
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}