# Nexus Code Style Guide

This document outlines the code style guidelines for the Nexus project.

## Core Principles

1. **Consistency** - The codebase should look like it was written by a single person, even with multiple contributors.
2. **Maintainability** - Code should be easy to understand, modify, and extend.
3. **Performance** - Follow best practices for performant code.
4. **Accessibility** - UI components should be accessible to all users.

## Tools and Configuration

The project uses the following tools for code quality:

- **ESLint** - For JavaScript/TypeScript linting
- **Prettier** - For code formatting
- **TypeScript** - For type safety
- **Husky** - For Git hooks
- **lint-staged** - For linting staged files
- **commitlint** - For commit message linting

## TypeScript Guidelines

- Use TypeScript for all new code
- Avoid using `any` type when possible
- Use interfaces for object shapes
- Create reusable types in dedicated type files
- Use type inference where it improves readability

## React Guidelines

- Use functional components with hooks
- Keep components small and focused
- Use React Server Components when appropriate
- Avoid excessive prop drilling (use context or state management)
- Optimize re-renders with memoization

## Naming Conventions

- **Files/Folders**: Use kebab-case for file names
- **Components**: Use PascalCase for component names
- **Functions/Variables**: Use camelCase
- **Interfaces/Types**: Use PascalCase prefixed with "I" (e.g., IUserProps)
- **Constants**: Use UPPER_SNAKE_CASE for global constants

## Import Order

1. External libraries
2. Internal modules
3. Types/interfaces
4. Styles

## Component Structure

```tsx
// Imports
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "./button.types";

// Component
export function Button({ children, className, variant = "default", ...props }: ButtonProps) {
  // State and hooks
  const [isLoading, setIsLoading] = useState(false);

  // Event handlers
  const handleClick = () => {
    setIsLoading(true);
    // ...
  };

  // Render
  return (
    <button
      className={cn("button", variant && `button-${variant}`, className)}
      onClick={handleClick}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
```

## Commit Messages

Follow the Conventional Commits specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to our CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

Example: `feat: Add user authentication component`

## Running Commands

```bash
# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix

# Run TypeScript type checking
npm run typecheck

# Format code with Prettier
npm run format

# Check formatting
npm run check-format
```

## Additional Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Prettier Documentation](https://prettier.io/docs/en/index.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Documentation](https://react.dev/)
