# NVIDIA AI features

The project now includes a role-protected AI Studio for teachers and administrators, with worksheet, lesson, quiz, child-friendly explanation, story, practice-question, lesson-plan, notice, report-draft, and general assistant tools. Generated content is editable, copyable, and printable. It is presented as a draft and is not automatically published or written into school records.

## Configure

1. Create an NVIDIA Build API key and verify the model endpoints available to your account at https://build.nvidia.com/models.
2. Copy `.env.example` to `.env.local` and set `NVIDIA_API_KEY` plus the model IDs that are actually available to you.
3. Keep the key server-side. Never use a `NEXT_PUBLIC_` prefix for it.
4. Restart the Next.js server and open `/teacher/ai` or `/admin/ai` after signing in with the matching role.

## Model routing

- Education generation: Gemma 4 31B IT.
- General teacher/admin assistance: Nemotron Lightning 30B A3B.
- Embeddings: Nemotron Embed (model configured; vector indexing/search still needs an embedding endpoint adapter and a vector store).
- Document parsing: Nemotron Parse (model configured; file upload and endpoint-specific parsing adapter are not yet wired into the UI).
- Input safety: Nemotron content safety model.
- Output safety: Llama 3.1 Nemotron Safety Guard.

NVIDIA endpoints may use different model identifiers, request formats, availability, rate limits, and access policies. The safety models are called using the chat-completions interface in this starter integration; confirm that the selected NVIDIA endpoint supports this format and tune its classification prompt/response parser before production use. A failed safety call blocks generation rather than bypassing the check.

## Important limitations

- AI generation requires a working NVIDIA Build endpoint and key; no credentials are included.
- Document parsing and semantic search are clearly marked as setup-required and return a not-implemented response until their dedicated API adapters and storage are added.
- Generated drafts are not automatically saved to Supabase. Teachers/admins must review, copy, or print them. Add an approved persistence workflow before using generated content as official school material.
- Do not submit sensitive student records or personally identifiable information to the AI endpoints without an approved data-protection arrangement.
