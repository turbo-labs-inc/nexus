# UI Components

This directory contains UI components from [shadcn/ui](https://ui.shadcn.com/) - a collection of reusable components built with Radix UI and Tailwind CSS.

## Components Included

- **Button**: Standard button component with various styles and sizes
- **Card**: Card component with header, content, and footer sections
- **Dialog**: Modal dialog component
- **Dropdown Menu**: Dropdown menu for navigation options
- **Input**: Text input field
- **Tabs**: Tabbed interface component
- **Form**: Form components with validation
- **Label**: Form label component
- **Sheet**: Sliding panel component that enters from the edge of the screen
- **Skeleton**: Placeholder loading state component
- **Progress**: Progress bar component
- **Tooltip**: Tooltip component for displaying additional information
- **Avatar**: Avatar component for user profiles
- **Badge**: Badge component for status indicators
- **Popover**: Popover component for displaying content
- **Select**: Dropdown select component
- **Accordion**: Expandable accordion component

## Theme Support

The components support both light and dark modes, controlled by:

- `ThemeProvider`: Context provider for theme settings
- `ThemeToggle`: Button for switching between light and dark themes

## Additional Features

- **Sonner**: Toast notifications system

## Usage

Components are imported directly from their location:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
```

These components use the `cn()` utility function from `@/lib/utils` to merge class names properly with Tailwind CSS.
