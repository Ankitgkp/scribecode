// Vercel's Express entry imports the bundled app so TypeScript path aliases
// and the generated Prisma client are resolved during the build.
import app from "./dist/src/handler.js";

export default app;
