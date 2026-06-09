# Styling Playbook

This playbook defines the first-pass styling system for the app.

## Tokens
- Colors are defined in CSS variables in `src/index.css`.
- Tailwind theme values map directly to those variables in `tailwind.config.ts`.

## Allowed Spacing Scale
- Use these spacing tokens by default: `1, 2, 3, 4, 6, 8`.
- Avoid ad-hoc spacing values unless there is a specific layout need.

## Typography Scale
- Hero/title: `text-3xl` on larger screens, `text-2xl` on mobile.
- Section/body text: `text-base`.
- Supporting metadata: `text-sm`.

## Component Patterns
- Primary panel: rounded container with `bg-app-panel`, `p-6` or `p-8`, and `shadow-card`.
- Primary button: `bg-app-accent`, white text, hover to `bg-app-accentStrong`.
- Secondary button: white background, subtle border, neutral text.
- Form controls: rounded inputs with visible focus states and adequate touch-friendly padding.
