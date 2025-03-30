# Claude Guidelines for ChoreTracker

## Commands
- **Start server**: `node server.js`
- **Install dependencies**: `npm install`
- **Run tests**: *To be implemented - will use Jest*
- **Lint code**: *To be implemented - will use ESLint*

## Code Style Guidelines
- **Formatting**: 2-space indentation, no trailing whitespace, max 100 chars per line
- **Naming**: camelCase for variables/functions, PascalCase for classes/components
- **Imports**: Group imports (1-node modules, 2-project modules, 3-relative)
- **Error handling**: Use try/catch for async operations, consistent error patterns
- **Types**: Use JSDoc comments for type annotations until TypeScript is implemented
- **Comments**: Only for complex logic, not obvious implementations
- **Components**: One component per file, clear separation of concerns
- **State management**: Consistent patterns for state updates and sharing

## Project Structure
- Express backend with RESTful API endpoints
- Future React frontend planned with component-based architecture
- MongoDB database planned for data persistence