import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
export const runtime='nodejs';
export async function GET(req:NextRequest){
 const role=req.headers.get('x-school-role')==='admin'?'admin':'teacher';
 const auth=await requireApiRole(role); if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
 const {data,error}=await auth.db.from('syllabus_units').select('id,class_name,subject,unit_title,details,created_at').order('class_name').order('subject').order('unit_title');
 if(error)return NextResponse.json({error:error.message},{status:500}); return NextResponse.json({items:data||[]});
}
export async function POST(req:NextRequest){
 const auth=await requireApiRole('admin'); if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});
 try{const b=await req.json();const class_name=String(b.class_name||'').trim(),subject=String(b.subject||'').trim(),unit_title=String(b.unit_title||'').trim(),details=String(b.details||'').trim();if(!class_name||!subject||!unit_title)return NextResponse.json({error:'Class, subject and unit title are required.'},{status:400});const {data,error}=await auth.db.from('syllabus_units').insert({class_name,subject,unit_title,details}).select().single();if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({item:data});}catch{return NextResponse.json({error:'Invalid request.'},{status:400});}
}
export async function DELETE(req:NextRequest){const auth=await requireApiRole('admin');if('error' in auth)return NextResponse.json({error:auth.error},{status:auth.status});const id=new URL(req.url).searchParams.get('id');if(!id)return NextResponse.json({error:'Missing unit id.'},{status:400});const {error}=await auth.db.from('syllabus_units').delete().eq('id',id);if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({ok:true});}
