# Nexus Project Guidelines

## Core Principles

1. **Stack-First Approach**: The tech stack is paramount. For each task:

   - Document how we're using each technology
   - Create reference materials for future use
   - Use Brave Search to deeply research docs for unfamiliar components (especially Fast-Agents)
   - Maintain a knowledge repository of implementation patterns

2. **Code Quality**:

   - Review all code before completion
   - Refactor to maintain exceptional cleanliness
   - Prefer readability and maintainability
   - Use consistent patterns across the codebase
   - Document complex logic
   - Run linting and typechecking with each completed task:
     ```
     npm run lint
     npm run typecheck
     npm run check-format
     ```

3. **Communication Protocol**:
   - Address user as "TURBONIUM"
   - Provide clear, concise updates
   - When uncertain, research thoroughly before proceeding
   - After completing each task:
     - Ensure no questions remain
     - Verify code has been tested (when possible)
     - Review code for quality
     - Create a git commit with a descriptive message
     - Move on to the next task in the implementation plan
   - Review /docs folder and implementation plan before starting each task, but after you commit - keep going, don't stop.

## Tech Stack Reference

### Next.js 15 + React 19

- App Router architecture
- Server Components where appropriate
- Client Components for interactive elements
- React Server Actions for form handling

### TypeScript

- Strong typing for all components
- Type definitions for all APIs
- Zod for runtime validation

### Tailwind CSS 4

- Mobile-first responsive design
- Utilize CSS cascade layers
- Custom color schemes with OKLCH
- Component-level styling

### Supabase + Oslo

- Authentication flows
- User data management
- Row-level security policies
- Session management

### MCP Integration

- Model Context Protocol servers integration
- Tool/server management
- Capability registry management
- Orchestration workflows

### Fast-Agent Bridge

- Python Fast-Agent server communication
- WebSocket real-time updates
- Multimodal content processing
- Tool integrations

### UI Components

- Shadcn/UI component library
- Custom multimodal chat components
- Workflow designer with ReactFlow
- Execution monitoring dashboards

## File Structure

```
/src
  /app             # Next.js app router
  /components      # React components
    /ui            # Base UI components
    /layout        # Layout components
    /auth          # Authentication components
    /chat          # Chat interface components
    /orchestration # Workflow components
  /lib             # Utility functions
    /mcp           # MCP integration
    /fast-agent    # Fast-Agent bridge
    /supabase      # Supabase client
  /context         # React context providers
  /hooks           # Custom React hooks
  /types           # TypeScript type definitions
  /styles          # Global styles
/public            # Static assets
/python            # Python code for Fast-Agent
```

This document will evolve as the project progresses.
