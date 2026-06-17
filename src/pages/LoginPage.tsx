import { ShieldCheck } from "lucide-react";
import { supabase } from "../supabaseClient";

export function LoginPage() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
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

        <h2>Welcome back</h2>
        <p className="login-subtitle">
          Sign in securely to access your portfolio, watchlist, alerts and risk settings.
        </p>

        <button type="button" className="google-login-button" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className="login-note">
          SellSmart is not financial advice. Authentication is powered by Supabase.
        </p>
      </section>
    </main>
  );
}