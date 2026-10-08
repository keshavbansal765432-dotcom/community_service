import AppShell from '@/components/AppShell'; import {requireRole} from '@/lib/auth'; import SyllabusManager from '@/components/ai/SyllabusManager';
export default async function SyllabusPage(){await requireRole('admin');return <AppShell role="admin" title="Syllabus"><SyllabusManager/></AppShell>}
