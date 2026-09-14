# Code Reviewer Skill

## Purpose
Review code changes for quality, security, and best practices.

## When to Use
- Before committing code changes
- When refactoring existing code
- When onboarding new contributors

## Instructions

1. **Code Quality Checks**:
   - Verify TypeScript/Python type safety
   - Check for proper error handling
   - Ensure consistent code style
   - Validate naming conventions

2. **Security Review**:
   - Never expose API keys or secrets
   - Validate user input properly
   - Use parameterized queries
   - Implement proper authentication checks

3. **Performance Review**:
   - Check for unnecessary re-renders (React)
   - Verify database query efficiency
   - Ensure proper caching strategies
   - Validate bundle size impact

4. **Architecture Review**:
   - Follow separation of concerns
   - Ensure proper component composition
   - Validate API design consistency
   - Check for proper dependency management

## Output Format
```markdown
## Review Summary
- **Status**: ✅ Approved / ⚠️ Needs Changes / ❌ Rejected
- **Files Reviewed**: X files
- **Issues Found**: X critical, X warnings, X suggestions

## Issues
### Critical
- [file:line] Description

### Warnings
- [file:line] Description

### Suggestions
- [file:line] Description
```
