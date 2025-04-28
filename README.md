# Nexus Platform

Nexus is a modern web application that integrates MCP (Model Context Protocol) capabilities with a Fast-Agent bridge, all wrapped in a responsive PWA (Progressive Web App) interface.

## Features

- **PWA Support**: Full offline capabilities with service worker caching
- **Responsive Design**: Mobile-first layout that adapts to any screen size
- **Dark/Light Mode**: Automatic theme detection with manual override
- **Modern UI**: Sleek design using Tailwind CSS 4 and shadcn/ui components
- **MCP Integration**: Connect to AI models through Model Context Protocol
- **Fast-Agent Bridge**: Communicate with Python-based Fast-Agent servers
- **Authentication**: Secure user authentication through Supabase and Oslo
- **Workflow Orchestration**: Visual workflow designer for automation

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4, CSS Cascade Layers, OKLCH color schemes
- **Components**: shadcn/ui component library
- **Authentication**: Supabase, Oslo
- **State Management**: React Context API
- **Database**: Supabase PostgreSQL with row-level security
- **API**: React Server Actions, RESTful endpoints

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 10.x or later

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nexus.git
   cd nexus
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3131](http://localhost:3131) with your browser to see the result.

## Development Workflow

- **Development**: `npm run dev` (uses Turbopack for fast refresh)
- **Safe Development**: `npm run dev:safe` (for use with Cypress or when facing middleware issues)
- **Type Checking**: `npm run typecheck`
- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Build**: `npm run build`
- **Start Production**: `npm run start`
- **Cypress Testing**: `npm run e2e` (uses safe development mode)

### Troubleshooting

If you encounter the app spinning indefinitely when running `npm run dev` (especially with Cypress tests), use the safer development mode:

```bash
npm run dev:safe
```

This script:
- Ensures required environment variables are set
- Starts the Next.js development server with additional safeguards
- Prevents middleware issues that can cause infinite spinning

## Project Structure

```
/src
  /app             # Next.js app router
  /components      # React components
    /ui            # Base UI components
    /layout        # Layout components
    /auth          # Authentication components
    /chat          # Chat interface components
    /orchestration # Workflow components
    /pwa           # Progressive Web App components
  /lib             # Utility functions
    /pwa           # PWA utilities
    /mcp           # MCP integration
    /fast-agent    # Fast-Agent bridge
    /supabase      # Supabase client
    /utils         # General utility functions
  /context         # React context providers
  /hooks           # Custom React hooks
  /types           # TypeScript type definitions
/public            # Static assets
  /icons           # App icons
/docs              # Documentation
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
