import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function requireApiRole(role: 'admin'|'teacher') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const { data: profile } = await supabase.from('profiles').select('id,full_name,email,role,active').eq('id', user.id).maybeSingle();
  if (!profile?.active || profile.role !== role) return { error: 'Forbidden', status: 403 as const };
  return { user, profile, db: createAdminClient() };
}

export async function requireAdminApi() { return requireApiRole('admin'); }
export async function requireTeacherApi() { return requireApiRole('teacher'); }
