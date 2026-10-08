export const AI_MODELS = {
  education: process.env.NVIDIA_MODEL_EDUCATION || 'google/gemma-4-31b-it',
  assistant: process.env.NVIDIA_MODEL_ASSISTANT || 'nvidia/nemotron-3.5-lightning-30b-a3b',
  embeddings: process.env.NVIDIA_MODEL_EMBEDDINGS || 'nvidia/nemotron-embed-1b-v2',
  parser: process.env.NVIDIA_MODEL_PARSER || 'nvidia/nemotron-parse',
  safety: process.env.NVIDIA_MODEL_SAFETY || 'nvidia/nemotron-content-safety',
  safetyGuard: process.env.NVIDIA_MODEL_SAFETY_GUARD || 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
} as const;
export type AITask = 'worksheet'|'lesson'|'quiz'|'explain'|'story'|'questions'|'lesson-plan'|'notice'|'school-report'|'assistant'|'document'|'search';
export function modelForTask(task: AITask) {
  if (task === 'assistant' || task === 'lesson-plan' || task === 'notice' || task === 'school-report') return AI_MODELS.assistant;
  if (task === 'document') return AI_MODELS.parser;
  if (task === 'search') return AI_MODELS.embeddings;
  return AI_MODELS.education;
}
