import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "../supabaseClient";

type AuthMode = "signin" | "signup" | "reset";

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authRedirectTo = window.location.origin;

  const clearFeedback = () => {
    setMessage("");
    setErrorMessage("");
  };

  const handleGoogleLogin = async () => {
    clearFeedback();
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authRedirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (mode !== "reset" && password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) throw error;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: authRedirectTo,
          },
        });

        if (error) throw error;

        setMessage("Account created. Please check your email to confirm your SellSmart account.");
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${authRedirectTo}/reset-password`,
        });

        if (error) throw error;

        setMessage("Password reset email sent. Please check your inbox.");
        setMode("signin");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    mode === "signup" ? "Create your account" : mode === "reset" ? "Reset password" : "Welcome back";

  const subtitle =
    mode === "signup"
      ? "Create a SellSmart account with email and password."
      : mode === "reset"
        ? "Enter your email and we will send a password reset link."
        : "Sign in securely to access your portfolio, watchlist, alerts and risk settings.";

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </div>

          <div>
            <h1>
              Sell<span>Smart</span>
            </h1>
            <p>AI-powered risk intelligence for retail investors</p>
          </div>
        </div>

        <div className="login-hero-icon">
          <ShieldCheck size={34} />
        </div>

        <h2>{title}</h2>
        <p className="login-subtitle">{subtitle}</p>

        {mode !== "reset" && (
          <button
            type="button"
            className="google-login-button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
          >
            Continue with Google
          </button>
        )}

        {mode !== "reset" && <div className="login-divider">or continue with email</div>}

        <form className="email-login-form" onSubmit={handleEmailAuth}>
          <label className="login-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          {mode !== "reset" && (
            <label className="login-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
              />
            </label>
          )}

          {mode === "signup" && (
            <label className="login-field">
              <span>Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {errorMessage && <p className="login-alert login-alert-error">{errorMessage}</p>}
          {message && <p className="login-alert login-alert-success">{message}</p>}

          <button type="submit" className="email-login-button" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "signup"
                ? "Create account"
                : mode === "reset"
                  ? "Send reset link"
                  : "Sign in"}
          </button>
        </form>

        <div className="login-switch-row">
          {mode === "signin" && (
            <>
              <button type="button" onClick={() => { clearFeedback(); setMode("signup"); }}>
                Create account
              </button>
              <span>·</span>
              <button type="button" onClick={() => { clearFeedback(); setMode("reset"); }}>
                Forgot password?
              </button>
            </>
          )}

          {mode !== "signin" && (
            <button type="button" onClick={() => { clearFeedback(); setMode("signin"); }}>
              Back to sign in
            </button>
          )}
        </div>

        <p className="login-note">
          SellSmart is not financial advice. Authentication is powered by Supabase.
        </p>
      </section>
    </main>
  );
}
