# Sources and adaptation notes

## Source and adaptation

The frontend organization approach documented in this skill comes from
**Kyle Cook / Web Dev Simplified**, through his video and example repository.
**Artur Blaya** adapted that material into `frontend-feature-architecture` and
maintains the skill and its distribution. This project is an independent adaptation
and does not claim endorsement or authorship of the original video or example application.

## Video and transcript research

- Video: [This Folder Structure Makes Me 100% More Productive](https://www.youtube.com/watch?v=xyxrB2Aa7KE).
- Creator: Web Dev Simplified; presenter introduces himself as Kyle.
- Publication date in retrieved video metadata: 2024-10-19.
- Duration in retrieved metadata: 24 minutes, 35 seconds.
- Research date: 2026-10-09.
- Evidence reviewed: the complete English automatic-caption track, recovered as
  YouTube JSON3 and normalized into timestamped text for research.
- Raw caption SHA-256: `13bea5180e57d1ec77b1c51a76bcea0f2635f54c86704b6ee2809331514236c3`.

The English automatic-caption track was retrieved with `yt-dlp` and reviewed
alongside the source repository. Automatic captions may contain transcription mistakes; the
source tree was inspected to corroborate implementation details. The full transcript
is a research input, not redistributed as part of this skill. The guidance here is
original wording, with timestamps for checking the source.

| Video section | Architectural takeaway used here |
| --- | --- |
| [00:00](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=0s) | The organization model is independent of language and framework |
| [01:05](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=65s) | Technical root folders scatter one capability across many locations as the application grows |
| [05:25](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=325s) | Global and feature-specific code mixed together makes ownership difficult to understand |
| [08:15](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=495s) | Introduce feature folders; root foundations contain genuinely shared code |
| [09:25](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=565s) | Put capability-specific UI and data operations inside the capability |
| [09:38](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=578s) | Application pages glue feature pieces together |
| [10:33](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=633s) | Shared foundations are independent; features use foundations; application uses both |
| [12:08](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=728s) | Create only the role folders a particular feature actually needs |
| [13:23](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=803s) | Much of a migration can be relocation plus import changes |
| [22:32](https://www.youtube.com/watch?v=xyxrB2Aa7KE&t=1352s) | Cross-feature permissions require a real dependency refactor; pass facts or localize policy |

The requested exclusion is deliberate: this adaptation omits the video's lint
configuration section. The architectural dependency model remains explicit without
adding enforcement plugins or configuration.

## Example repository inspection

- Original: [WebDevSimplified/parity-deals-clone, feature-folder-structure branch](https://github.com/WebDevSimplified/parity-deals-clone/tree/feature-folder-structure).
- Inspected commit: [`48c95960cda340248fd6004b72a2441bda22b517`](https://github.com/WebDevSimplified/parity-deals-clone/tree/48c95960cda340248fd6004b72a2441bda22b517).
- Original license: [MIT, copyright 2024 WebDevSimplified](https://github.com/WebDevSimplified/parity-deals-clone/blob/48c95960cda340248fd6004b72a2441bda22b517/LICENSE).

Paths below are observations about the source application, not framework-specific
templates to create in a consuming project:

| Inspected path | Evidence and interpretation |
| --- | --- |
| `src/features/products/` | Colocates product UI, schemas, and server data/operation code |
| `src/features/analytics/` | Colocates charts and analytics data access |
| `src/features/subscriptions/` | Contains operation/data code without requiring a UI folder |
| `src/features/users/` | Contains data access without replicating the full root tree |
| `src/components/ui/` | Holds reusable presentation primitives |
| `src/lib/formatters.ts` | Holds common formatting behavior |
| `src/drizzle/db.ts` and `src/drizzle/schema.ts` | Demonstrate shared persistence infrastructure in a server-capable application; these are not requirements for a client-only frontend |
| `src/app/dashboard/products/page.tsx` | Application integration imports product capabilities and renders the empty or populated branch |
| `src/app/dashboard/analytics/page.tsx` | Application integration uses analytics and product capabilities together |
| `src/lib/permissions.ts` | Imports products, analytics, and subscriptions; this is the known exception discussed near the end of the video |

The source's shared permissions module means the inspected repository is not a
perfect instance of its stated boundary model. Its application files also retain
some composition helpers. This skill therefore follows the stated responsibilities
and explicitly resolves the permission seam rather than copying every file location.

The source imports selected feature modules directly; a mandatory public barrel is
not established by that example. This skill recommends an intentional public surface
and makes the exact entrypoint mechanism a project choice.

## What this adaptation adds

The three responsibilities, feature colocation, sibling independence, one-way
dependencies, conditional role folders, and permission-refactoring seam are grounded
in the video and corroborated by the repository.

The detailed placement table, narrow callbacks and capability contracts, type-only
dependency guidance, lifecycle handling, public-surface conventions, platform and
runtime adaptations, incremental migration procedure, and review checklist are
this project's engineering synthesis. They make the model actionable across frontend
environments; they are not claims that the video specifies each technique.

The examples are original framework-neutral pseudocode. No source application code
or full video transcript is bundled. This project is licensed separately under MIT;
the original material retains its own authorship and rights.

## Harness packaging references

The portable manifest uses the [Agent Skills specification](https://agentskills.io/specification):
`SKILL.md`, a matching name, a description, and linked supporting resources.
Harness-specific installation locations were checked on 2026-10-09:

- [Codex skill documentation](https://learn.chatgpt.com/docs/build-skills): repository
  `.agents/skills/` and user `~/.agents/skills/`; optional `agents/openai.yaml` metadata.
- [Claude Code skills documentation](https://code.claude.com/docs/en/skills): project
  `.claude/skills/` and personal `~/.claude/skills/`; direct `/skill-name` invocation.
- [OpenCode skills documentation](https://opencode.ai/docs/skills/): project
  `.opencode/skills/` and global `~/.config/opencode/skills/`; discovery and loading
  through its skill capability. It also supports agent-compatible and Claude-compatible
  discovery directories.

Installation paths can change between harness releases. Keep installation guidance
separate from the framework-neutral architecture instructions and recheck official
documentation when updating compatibility. Filesystem installation tests do not
establish end-to-end execution in all harnesses.
