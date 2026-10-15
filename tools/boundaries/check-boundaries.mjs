/**
 * CI gate for the module boundaries in PRD 5.4 (NFR-20). The rules live in
 * rules.mjs; this reads the Nx project graph and reports what they find.
 *
 * Run it on Node, as the root script does. Building the graph from a cold Nx
 * cache loads every vite.config.mts, and under Bun that load fails.
 */
import { createProjectGraphAsync } from '@nx/devkit';
import { findViolations } from './rules.mjs';

const graph = await createProjectGraphAsync({ exitOnError: false });
const violations = findViolations(graph);

if (violations.length > 0) {
  console.error('Module boundary violations:\n');
  for (const violation of violations) console.error(`  - ${violation}`);
  console.error('\nSee docs/prd/5.4-repository-layout.md and docs/architecture/README.md.');
  process.exit(1);
}

console.log(`Module boundaries OK (${Object.keys(graph.nodes).length} projects).`);
