// Imports
// ========================================================
import { mergeRouters } from '../trpc';
import AuthRouter from './auth';

// Types
// ========================================================
// We'll need this later for our frontend
type AppRouter = typeof appRouter;

// Routes
// ========================================================
const appRouter = mergeRouters(AuthRouter);

// Exports
// ========================================================
export default appRouter;
export {
    AppRouter
}