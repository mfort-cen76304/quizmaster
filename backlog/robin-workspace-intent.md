# Robin AI — Workspace intent via UI, not prompt-parsing

## Issue

`WorkspaceRobinAiHelper` decides what the user wants by parsing free-text:

- `wantsMultipleQuestions(prompt)` — strips diacritics, looks for an integer followed by `question*` / `otaz*` to switch to batch generation.
- `isSaveGeneratedQuestionsPrompt(prompt)` — looks for a save verb (`save`, `store`, `uloz*`) plus a question/reference target (`questions`, `it`, `to`, `je`, `ich`) to commit drafts to the workspace.

This is a hidden mini-NLP layer that branches control flow. "Save 1 question" works,
"persist these" doesn't. "5 otázky" works, "pět otázek" doesn't. The user has no UI
affordance telling them which phrases are recognised, and a misclassification silently
generates instead of saves (or vice-versa).

The chat feature file currently pins specific phrasings (`"Uloz to"`, `"Vytvor 2 otazky..."`),
which means the spec layer is also tied to the heuristic.

## Approaches

**Preferred — explicit composer controls.** Keep the chat composer for the prompt content,
but turn intent into buttons:

- A "Generate" button on the composer; alongside it, a small count selector (1 / 2 / 5 / N).
  Replaces `wantsMultipleQuestions` entirely — `postAiAssistant` vs `postAiAssistantBatch`
  is chosen by the count, not by parsing.
- A "Save all drafts" button that appears once `generatedDrafts.length > 0`. Replaces
  `isSaveGeneratedQuestionsPrompt`.

**Smaller alternative — slash commands.** `/save`, `/generate 5` parsed as a single
explicit token. Cheaper to implement; still teaches a vocabulary.

## Files in scope

- `frontend/src/pages/make/workspace/workspace-robin-ai-helper.tsx` — drop the two
  heuristic functions and the `generateWorkspaceRobinDrafts` branch on them.
- `frontend/src/pages/make/create-question/robin-ai/robin-sheet.tsx` — chat-mode composer
  needs a place for the new buttons (currently shows only the textarea).
- `specs/features/make/workspace/Workspace.AIAssist.Chat.feature` — replace `"Uloz to"` /
  `"Vytvor 2 otazky..."` triggers with explicit step-driven button clicks.
- `specs/src/pages/robin-sheet-page.ts` — page object gains `clickGenerate(count?)` and
  `clickSaveAll()`.

## Notes

- This concern is independent of every other backlog item. It can land alone.
- Once the heuristic is gone, the workspace Robin and the per-question Robin diverge only
  in their `generateRequest` plumbing — worth checking afterwards whether the
  `mode: 'classic' | 'chat'` switch in `RobinSheet` is still needed.
