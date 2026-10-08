import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    const { data: existingAdmin, error } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ setupOpen: false, error: "Database is not ready. Run db/schema.sql first." }, { status: 500 });
    }

    return NextResponse.json({ setupOpen: !existingAdmin });
  } catch {
    return NextResponse.json({ setupOpen: false, error: "Supabase environment variables are not configured." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must contain at least 8 characters." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: existingAdmin, error: adminCheckError } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("active", true)
      .limit(1)
      .maybeSingle();

    if (adminCheckError) {
      console.error(adminCheckError);
      return NextResponse.json({ error: "Could not check administrator status. Run db/schema.sql first." }, { status: 500 });
    }

    if (existingAdmin) {
      return NextResponse.json({ error: "Initial setup is already locked. Please use /login." }, { status: 409 });
    }

    const { data, error } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Admin account could not be created." }, { status: 400 });
    }

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        role: "admin",
        active: true,
      });

    if (profileError) {
      await adminSupabase.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Admin setup failed. Check your three Supabase values in .env.local." }, { status: 500 });
  }
}
