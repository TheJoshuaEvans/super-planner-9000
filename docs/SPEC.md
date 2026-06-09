# Core Specifications

1. Must be designed for both mobile and desktop use.
2. Must store all user data in local storage.
3. This app is intended for personal use and no consideration should be given to commercialization.
4. This app must support static hosting like via GitHub.
5. Implementation must be as simple as possible
6. Keep things DRY (Avoid duplicate code wherever possible)
7. Honor separation of concerns
8. Separate code into different files whenever appropriate
9. All (non-boilerplate) functions should be documented with JSDoc
10. Function documentation must be concise, focusing on inputs, outputs, and side-effects

# Stack Specifications

- UI: React + TypeScript.
- State: Zustand.
- Styling: Tailwind + CSS Variables.
- Persistence: localStorage with a simple JSON data shape.

## Styling Specifications (Tailwind + CSS Variables)

- "Landscape-mode" is enforced, the styling does not need to support screens taller than they are wide

Guidelines for applying styles:
1. Use Tailwind for layout and component styling
2. Use CSS variables for core tokens (colors, spacing scale, radius, shadows).
3. Map Tailwind theme values to those variables.
4. Generate a short styling playbook as styles are added (allowed spacing scale, typography scale, component patterns).
