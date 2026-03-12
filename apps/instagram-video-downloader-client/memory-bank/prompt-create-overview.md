# Prompt: Create an Overview Component for an Entity (React, TypeScript)

## Goal

Create a robust, production-ready Overview component for a given entity (e.g., InstagramMediaContainer, Scenario, etc.) in a React + TypeScript codebase. The component must fetch entity data by id, display all relevant fields in a card-based layout, and follow strict UI/UX and code quality standards.

---

## Requirements

### 1. Data Fetching

- Use a fetch helper (e.g., `fetchGet`) to retrieve the entity by id from the backend.
- The id must be taken from the URL using `useParams` from `react-router-dom`.
- The API route must be defined in a central `Routes` enum (e.g., `Routes.get<Entity>ById`).
- Use the correct types for params and response (e.g., `Get<Entity>ByIdParams`, `Get<Entity>ByIdResponse`).
- Use `useContext` to get `isProd` from `AppEnvContext` if needed for environment switching.
- Fetch data on mount and when id changes.
- Show a loading state while fetching, an error state on failure, and a "Not found" state if the entity is missing.

### 2. Layout & UI

- Use a card-based layout, leveraging a reusable `CardTemplate` component.
- The main container should use a grid layout (e.g., `cardsContainer` from a CSS module) for future extensibility (multiple cards).
- All entity fields must be displayed in a definition list (`<dl>`), with clear formatting for optionals, booleans, arrays, and dates.
- The card must have a title, description, and may include actions (e.g., links to related entities).
- The card config must be defined as a `CardConfig[]` array, even if there is only one card. Render cards via `.map()`.
- Use the same visual and structural conventions as in the Scenario/Overview.tsx and InstagramMediaContainer/Overview.tsx examples.

### 3. Code Style & Structure

- Use TypeScript and React functional components.
- All types must be imported from the shared types location.
- Imports must be sorted and grouped (external, then internal, then styles).
- Use `useCallback` for fetch logic, and `useEffect` for lifecycle.
- Use `useState` for data, loading, and error states.
- All code must be linted and formatted according to project standards.
- No unused imports or variables.
- All props and state must be typed.
- No logic in the render body except for conditional rendering (loading, error, not found).

### 4. Extensibility

- The config array must be ready for future cards (e.g., related entities, JSON view, actions).
- Actions in cards must support both links and onClick handlers.
- The layout must be responsive and visually consistent with the rest of the app.

### 5. Example CardConfig (for reference)

```ts
const config: CardConfig[] = [
  {
    title: 'Entity Name',
    description: 'Entity details',
    colSpan: 2 as const,
    actions: [
      {
        text: 'Open related entity',
        link: `/related-entity/${entity.relatedId}`,
      },
    ],
    children: (
      <dl>
        <dt>ID</dt><dd>{entity.id}</dd>
        <dt>Name</dt><dd>{entity.name}</dd>
        {/* ...other fields... */}
      </dl>
    ),
  },
];
```

---

## Checklist for Review

- [ ] Fetches entity by id from URL, using correct types and route
- [ ] Handles loading, error, and not found states
- [ ] Uses CardTemplate and config array for layout
- [ ] Renders all fields, formatted and labeled
- [ ] Actions/links are present if relevant
- [ ] Code is clean, typed, and linted
- [ ] Layout matches app conventions and is responsive
- [ ] Ready for extension with more cards or actions

---

**Use this prompt as a strict template for all future Overview components.**
