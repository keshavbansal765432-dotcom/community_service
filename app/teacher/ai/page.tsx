import AppShell from '@/components/AppShell'; import {requireRole} from '@/lib/auth'; import AIStudio from '@/components/ai/AIStudio';
export default async function TeacherAI(){await requireRole('teacher');return <AppShell role="teacher" title="AI Studio"><AIStudio role="teacher"/></AppShell>}
