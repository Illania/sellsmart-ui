import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "../supabaseClient";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Password updated. You can now sign in with your new password.");
    setPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
  };

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

        <h2>Set new password</h2>
        <p className="login-subtitle">Choose a new password for your SellSmart account.</p>

        <form className="email-login-form" onSubmit={handleUpdatePassword}>
          <label className="login-field">
            <span>New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="login-field">
            <span>Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </label>

          {errorMessage && <p className="login-alert login-alert-error">{errorMessage}</p>}
          {message && <p className="login-alert login-alert-success">{message}</p>}

          <button type="submit" className="email-login-button" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>

        <div className="login-switch-row">
          <button type="button" onClick={() => { window.location.href = "/"; }}>
            Back to sign in
          </button>
        </div>
      </section>
    </main>
  );
}
