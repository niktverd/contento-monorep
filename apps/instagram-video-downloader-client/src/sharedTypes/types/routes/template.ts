import {baseRoutes} from './base';
import {getFullRoutes} from './utils';

// TODO: Replace 'feature' with actual feature name (e.g., 'scenario', 'source', etc.)
export const rootName = '/feature';

// TODO: Extend with feature-specific routes as needed
// Common patterns to consider:
// - For entities with stats: add `/statistics`
// - For entities with duplicates: add `/duplicates`
// - For unique checks: add `/has-been-created` or similar
// - For filtered lists: add `/list-by-<criteria>`
// - For slug-based access: add `/get-by-slug`
export const routes = {
    ...baseRoutes, // Provides: create, get, list, update, delete
    // Add feature-specific routes here, e.g.:
    // statistics: '/statistics',
    // duplicates: '/duplicates',
    // getBySlug: '/get-by-slug',
} as const;

export const fullRoutes = getFullRoutes({rootName, routes});
