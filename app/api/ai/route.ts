import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/api-auth';
import { AI_MODELS, modelForTask, type AITask } from '@/lib/ai/models';

export const runtime = 'nodejs';
const tasks: AITask[] = ['worksheet','lesson','quiz','explain','story','questions','lesson-plan','notice','school-report','assistant','document','search'];
const base = (process.env.NVIDIA_API_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');
const key = process.env.NVIDIA_API_KEY;
async function chat(model: string, system: string, prompt: string) {
  if (!key) throw new Error('NVIDIA_API_KEY is missing. Add it to .env.local and restart the server.');
  const response = await fetch(`${base}/chat/completions`, { method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'}, body:JSON.stringify({model,temperature:0.4,max_tokens:3500,messages:[{role:'system',content:system},{role:'user',content:prompt}]}) , cache:'no-store'});
  const data = await response.json().catch(()=>null);
  if (!response.ok) throw new Error(data?.error?.message || `NVIDIA endpoint returned ${response.status}`);
  return data?.choices?.[0]?.message?.content ?? '';
}
async function moderate(text: string, model: string) {
  // Moderation is deliberately attempted as a separate model call. Endpoint-specific schemas can be configured per NVIDIA model.
  try { return await chat(model, 'Classify whether the following school content is appropriate for children aged 6–11. Reply only SAFE or REVIEW.', text); }
  catch { return 'REVIEW'; }
}
export async function POST(req: NextRequest) {
  const role = req.headers.get('x-school-role') === 'admin' ? 'admin' : 'teacher';
  const auth = await requireApiRole(role);
  if ('error' in auth) return NextResponse.json({error:auth.error},{status:auth.status});
  try {
    const body = await req.json();
    const task = body.task as AITask;
    const prompt = String(body.prompt || '').trim();
    const teacherTasks: AITask[] = ['worksheet','lesson','quiz','explain','story','questions','lesson-plan'];
    const adminTasks: AITask[] = ['notice','school-report','assistant'];
    const allowed = role === 'admin' ? adminTasks : teacherTasks;
    if (!tasks.includes(task) || !allowed.includes(task) || !prompt) return NextResponse.json({error:'This role cannot use that AI tool, or the request is incomplete.'},{status:403});
    if (prompt.length > 12000) return NextResponse.json({error:'Prompt is too long (maximum 12,000 characters).'}, {status:413});
    if (task === 'document' || task === 'search') return NextResponse.json({error:`${task === 'document' ? 'Document parsing' : 'Embedding search'} use a dedicated NVIDIA endpoint and are not handled by chat completion. The model is configured; connect its endpoint-specific request format before using this operation.`},{status:501});
    const inputCheck = await moderate(prompt, AI_MODELS.safety);
    if (!/SAFE/i.test(inputCheck) || /REVIEW|UNSAFE/i.test(inputCheck)) return NextResponse.json({error:'This request needs review before it can be sent to the generator.'},{status:400});
    const instructions: Record<string,string> = {
      worksheet:'Create an age-appropriate printable worksheet for Indian primary-school students in Classes 1–5. Include a clear title, instructions, numbered questions, and an answer key. Do not claim alignment to a syllabus unless specified.',
      lesson:'Create a child-friendly lesson with objectives, short explanations, examples, interactive classroom activities, and a quick recap. Format with headings and concise bullet points suitable for a smart board.',
      quiz:'Create a quiz suitable for Classes 1–5. Include varied question types when requested and put the answer key in a separate section.',
      explain:'Explain the topic in simple language for a child aged 6–11. Use a familiar example and avoid jargon.',
      story:'Write a short educational story suitable for children aged 6–11, with a positive learning point and 3 comprehension questions.',
      questions:'Generate practice questions appropriate to the class and topic. Include an answer key separately.',
      'lesson-plan':'Create a practical teaching plan with learning objectives, materials, timed steps, activities, assessment, and homework.',
      notice:'Draft a clear, factual school notice. Do not invent dates, policies, names, or event details; use placeholders for missing information.',
      'school-report':'Create a neutral administrative report draft from the supplied facts. Do not invent student data or make unsupported judgments.',
      assistant:'Act as a practical assistant for school teachers and administrators. Give concise, actionable help. Do not invent school records.',
    };
    const generated = await chat(modelForTask(task), instructions[task], prompt);
    const outputCheck = await moderate(generated, AI_MODELS.safetyGuard);
    if (!/SAFE/i.test(outputCheck) || /REVIEW|UNSAFE/i.test(outputCheck)) return NextResponse.json({error:'Generated content was held for review. Try a different prompt or edit it manually.'},{status:422});
    return NextResponse.json({content:generated,model:modelForTask(task),reviewRequired:true});
  } catch (e) { return NextResponse.json({error:e instanceof Error ? e.message : 'AI request failed.'},{status:500}); }
}
