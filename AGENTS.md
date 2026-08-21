# Agent Instructions

- This project workspace has no source files, manifests, tests, CI configuration, or Git metadata.
- No build, test, lint, typecheck, formatter, or code-generation commands are verified for this workspace.
- Inspect newly added project files before assuming a language, framework, package manager, architecture, or developer command.

## Project Workflow Rules

- Every new feature must be documented in the project's specification before or as part of its implementation.
- A new feature is not complete until its corresponding specification has been updated.
- Whenever a requested change alters the existing specification or expected behavior, update the specification before making corresponding codebase changes.
- The specification change must precede implementation changes so that the specification remains the source of truth for the intended state.
- Make commits at a fine granularity.
- Prefer separate commits for individual features, fixes, refactors, specification updates, or other logically independent units of work.
- Avoid combining multiple unrelated changes into a single commit.
- When practical, keep each commit focused enough that its purpose and diff can be reviewed independently.
- If the user's current prompt conflicts with the existing project specification, treat the user's current prompt as the higher-priority requirement for the current task.
- Do not stop the task merely because such a conflict exists.
- Apply the user's requested behavior and update the specification as necessary before implementing the corresponding code changes.
- Inform the user that the existing specification differed from their request.
- If multiple specification differences or changes are discovered during the task, do not interrupt the user with individual reports for each one.
- First identify and compare all relevant specification differences, then report them together in a consolidated summary.
- All content that the user is expected or required to read during the development process must be written in Japanese.
- This applies to communication between the development agent and the user, including progress updates, explanations, warnings, findings, summaries, unavoidable questions, and final reports.
- This rule must not impose Japanese-language requirements on the product being developed. Product UI, source code, documentation, localization, identifiers, comments, tests, and other project artifacts should use whatever language is appropriate for their own requirements.
- Content that the user does not need to read may use another language when appropriate.
- Internal agent work, implementation notes, tool instructions, sub-agent prompts, and similar agent-to-agent communication may use languages other than Japanese when that improves clarity, efficiency, or output quality.
