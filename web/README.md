# FluxA MCP Web - Integrated Frontend

This is the integrated web frontend combining the best features from both the original and new frontend applications.

## Features

### Architecture
- **Framework**: Next.js 15 with React 19
- **Authentication**: Privy wallet integration
- **Styling**: Tailwind CSS with dark mode support
- **UI Components**: shadcn/ui (Radix UI primitives)
- **MCP Integration**: @modelcontextprotocol/sdk

### Main Flow
1. **Dual Forms Home Page** (`/`):
   - **Monetize MCP**: Configure your MCP server for earning
   - **Register Agent**: Register agents to use monetized MCP servers

2. **Monetize Flow**:
   - Enter MCP URL
   - Connect wallet via Privy
   - Configure tool pricing with sliders
   - Review and save configuration

3. **Register Agent Flow**:
   - Enter MCP server URL, email, and agent name
   - Get integration configs (Claude Code command or JSON)
   - Authorize agent to use FluxA wallet

4. **MCP Servers Dashboard** (`/mcp-servers`):
   - View all configured servers
   - Access integration details for each server

### Key Features
- ✅ Privy wallet authentication
- ✅ Dark/Light theme toggle
- ✅ Modern responsive design
- ✅ Multi-page navigation with header
- ✅ API routes for MCP connection and config saving
- ✅ Tool pricing configuration
- ✅ Claude Code integration support

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

Dependencies are already installed. If you need to reinstall:

\`\`\`bash
npm install
\`\`\`

### Development

Run the development server:

\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:3099`

### Build for Production

\`\`\`bash
npm run build
npm start
\`\`\`

The production server runs on port 3001.

## Environment Variables

Create a `.env.local` file (already included):

\`\`\`env
NEXT_PUBLIC_PRIVY_APP_ID=cmho7jdx702knli0c88gb5g1b
\`\`\`

## Project Structure

\`\`\`
web/
├── app/
│   ├── api/
│   │   ├── connect/route.ts      # MCP connection endpoint
│   │   └── save/route.ts         # Config save endpoint
│   ├── mcp-servers/
│   │   ├── page.tsx              # Servers list page
│   │   └── [id]/page.tsx         # Server detail page
│   ├── globals.css               # Global styles with theme
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Home page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── header.tsx                # Navigation header
│   ├── mcp-forms-page.tsx        # Dual forms component
│   ├── monetize-detail-page.tsx  # Monetization config
│   ├── register-agent-detail-page.tsx  # Agent registration
│   ├── review-config-page.tsx    # Config review
│   ├── mcp-servers-page.tsx      # Servers dashboard
│   ├── mcp-server-detail-page.tsx # Server details
│   ├── theme-provider.tsx        # Theme context
│   ├── theme-switcher.tsx        # Theme toggle button
│   ├── ClientProviders.tsx       # Client-side providers
│   └── Providers.tsx             # Privy provider setup
└── lib/
    ├── types.ts                  # TypeScript interfaces
    └── utils.ts                  # Utility functions
\`\`\`

## Integration Details

### Combining Both Frontends

| Feature        | Original Frontend              | New Frontend                  | **Integrated Solution**       |
|----------------|--------------------------------|-------------------------------|-------------------------------|
| Framework      | Next.js 15, React 19           | Next.js 14, React 19          | **Next.js 15, React 19**      |
| Main Flow      | 3-step wizard                  | Dual forms                    | **Dual forms**                |
| Authentication | Privy wallet integration       | Manual wallet address         | **Privy wallet integration**  |
| Navigation     | Single page flow               | Multi-page with header        | **Multi-page with header**    |
| Design         | Card-based wizard              | Modern dashboard layout       | **Modern dashboard layout**   |
| Theme          | Light only                     | Light/Dark theme support      | **Light/Dark theme support**  |
| Config Storage | API routes write to configs-db | Direct import from configs-db | **API routes to configs-db**  |

### API Routes

#### POST /api/connect
Connects to an upstream MCP server and fetches available tools.

**Request**:
\`\`\`json
{
  "upstreamUrl": "https://example.com/mcp"
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "serverName": "My MCP Server",
  "serverVersion": "1.0.0",
  "tools": [...]
}
\`\`\`

#### POST /api/save
Saves MCP server configuration to `../src/configs-db/{uuid}.json`

**Request**:
\`\`\`json
{
  "upstreamUrl": "https://example.com/mcp",
  "serverName": "My Server",
  "yourWallet": "0x...",
  "tools": [...]
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "configId": "uuid",
  "path": "/path/to/config.json",
  "proxyUrl": "http://localhost:3003/mcp/uuid"
}
\`\`\`

## Usage

### Monetize Your MCP Server

1. Go to home page (`/`)
2. Fill in the "Monetize MCP" form with your MCP server URL
3. Click "Add Monetize URL"
4. Connect your wallet via Privy
5. Configure tool pricing using sliders
6. Review and save your configuration

### Register an Agent

1. Go to home page (`/`)
2. Fill in the "Register Agent to Use MCP" form
3. Enter MCP server URL, email, and agent name
4. Click "Register Agent"
5. Copy the integration config (Claude Code command or JSON)
6. Add to your Claude Desktop configuration

### View Configured Servers

1. Navigate to "MCP Servers" in the header
2. View all configured servers
3. Click on a server to see tools and integration details

## Next Steps

- Connect to real MCP servers
- Implement actual API calls in MonetizeDetailPage to fetch tools
- Add authentication and authorization
- Implement config persistence and loading from configs-db
- Add error handling and loading states
- Test Privy wallet connection thoroughly

## Contributing

This is an integrated solution combining the best of both frontend implementations. Feel free to customize and extend based on your needs.
