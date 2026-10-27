# Frontend Builder Skill

## Purpose
Assist with React frontend development, component design, and UI/UX implementation.

## When to Use
- When creating new React components
- When implementing UI features
- When optimizing frontend performance
- When debugging React applications

## Instructions

1. **Component Design Principles**:
   - Follow single responsibility principle
   - Keep components small and focused
   - Use composition over inheritance
   - Implement proper prop types
   - Handle loading and error states

2. **React Best Practices**:
   - Use hooks for state and side effects
   - Implement proper cleanup in useEffect
   - Use React.memo for expensive components
   - Implement proper key props for lists
   - Avoid inline functions in JSX

3. **TypeScript Integration**:
   - Define proper interfaces for props
   - Use type guards for API responses
   - Implement proper error boundaries
   - Use generics for reusable components

4. **Styling with Tailwind CSS**:
   - Use consistent design tokens
   - Implement responsive design
   - Use CSS variables for theming
   - Optimize for dark mode support
   - Follow mobile-first approach

## Internationalization (i18n) & Question Translation

The app has two independent language settings:

- **UI language** — `frontend/src/i18n/en.ts` and `pt.ts`, managed by `LanguageContext`
- **Question language** — `questionLanguage` in `LanguageContext`, persisted in `localStorage.questionLanguage`

Guidelines:

- Use `<QuestionLanguageToggle />` for the EN/PT-BR question selector
- Keep question translation logic in `frontend/src/i18n/questions.ts`
- Questions are stored in English; only translate when `questionLanguage === 'pt-BR'`
- Use Google Translate first, fall back to MyMemory, and always fall back to the original text
- Cache successful translations in memory and `localStorage`
- Apply translations incrementally so the current question is not blocked by the whole exam
- Cancel in-flight translation effects on language/question changes
- Never translate Azure product names, SKUs, cmdlets, CLI commands, or acronyms
- Keep the UI language and question language independent once the user overrides the question language

## Component Template

```typescript
import { useState, useEffect } from 'react'

interface ComponentProps {
  // Define props here
}

export default function Component({ }: ComponentProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Cleanup function
    return () => {}
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="...">
      {/* Component content */}
    </div>
  )
}
```

## Performance Optimization
- Use React.lazy for code splitting
- Implement proper memoization
- Avoid unnecessary re-renders
- Use Web Vitals for performance tracking
- Optimize images and assets
