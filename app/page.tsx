import { createClient } from '@/lib/supabase/server'; import { redirect } from 'next/navigation';
export default async function Home(){const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect('/login');const {data:p}=await s.from('profiles').select('role').eq('id',user.id).maybeSingle();redirect(p?.role==='admin'?'/admin':'/teacher')}
