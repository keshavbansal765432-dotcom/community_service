import AppShell from '@/components/AppShell'; import {requireRole} from '@/lib/auth'; import AIStudio from '@/components/ai/AIStudio';
export default async function AdminAI(){await requireRole('admin');return <AppShell role="admin" title="AI Studio"><AIStudio role="admin"/></AppShell>}
