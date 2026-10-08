"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Unable to verify your account.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, active")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();
      setError("Your account profile was not found. Contact the administrator.");
      setLoading(false);
      return;
    }

    if (!profile.active) {
      await supabase.auth.signOut();
      setError("This account is inactive. Contact the administrator.");
      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/teacher");
    }

    router.refresh();
  }

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-brand">🎓 Edu School School</div>

        <h1>Welcome back</h1>

        <p>
          Sign in using the account provided by your school administrator.
        </p>

        {error && <div className="error">{error}</div>}

        <div className="field">
          <label>Email</label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@school.com"
          />
        </div>

        <div className="field">
          <label>Password</label>

          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button className="auth-submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 18,
            color: "#6b7280",
          }}
        >
          Need an account? Contact your school administrator.
        </p>

        <p style={{ textAlign: "center", marginTop: 10 }}>
          <a href="/admin/setup" style={{ color: "#14532d", fontWeight: 700 }}>
            First-time setup: Create the first Admin
          </a>
        </p>
      </form>
    </main>
  );
}