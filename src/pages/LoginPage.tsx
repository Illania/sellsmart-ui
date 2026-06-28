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
            <span className="google-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
              </svg>
            </span>
            <span>Continue with Google</span>
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
