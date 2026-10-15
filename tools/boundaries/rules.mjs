/**
 * Module boundary rules from PRD 5.4 "Repository layout" and the
 * architecture guide (docs/architecture/README.md, "Level 1").
 *
 * The workspace lints with Biome, which has no module-boundary rule, so these
 * run over the Nx project graph instead of through
 * @nx/enforce-module-boundaries and its ESLint dependency.
 *
 * Kept free of Nx imports so the rules can be tested against small fixture
 * graphs; check-boundaries.mjs feeds them the real one.
 */

export const TYPES = ['app', 'core', 'contracts', 'domain', 'api', 'web'];

/** Scopes that are not modules: everything else is one module's scope. */
const PLATFORM_SCOPES = new Set(['app', 'core']);

/**
 * Packages `domain` and `contracts` must not reach: domain stays runnable
 * without a framework, and contracts also ship to the browser (ADR-0001
 * action 1).
 */
export const FRAMEWORK_PACKAGES = [
  '@nestjs/',
  'fastify',
  '@fastify/',
  'react',
  'react-dom',
  '@tanstack/',
  'drizzle-orm',
  'pg',
  'postgres',
  'pg-boss',
];

/**
 * Packages that only run on the server and must never reach the browser. A
 * new server-only package belongs here when it is installed (tech-stack.md,
 * follow-up 1).
 */
export const SERVER_PACKAGES = [
  '@nestjs/',
  'fastify',
  '@fastify/',
  'drizzle-orm',
  'drizzle-kit',
  'pg',
  'postgres',
  'pg-boss',
  'nodemailer',
  '@simplewebauthn/server',
];

/** Core projects carry `type:core`, so which side they run on is named here. */
const SERVER_SIDE_PROJECTS = new Set(['@core/api', '@core/db']);
const WEB_SIDE_PROJECTS = new Set(['@core/ui', '@app/fiscus-web']);

/**
 * Nx names external nodes `npm:<package>`, with `@<version>` appended when the
 * lockfile holds more than one version of it.
 */
function packageName(target) {
  return target.slice('npm:'.length).replace(/(?<=.)@.*$/, '');
}

/** A trailing slash marks a whole scope; anything else is one package. */
function matchesAny(name, packages) {
  return packages.some((pkg) =>
    pkg.endsWith('/') ? name.startsWith(pkg) : name === pkg || name.startsWith(`${pkg}/`),
  );
}

function tagValue(tags, prefix) {
  const matches = tags.filter((tag) => tag.startsWith(prefix));
  return matches.length === 1 ? matches[0].slice(prefix.length) : undefined;
}

/** The project's scope and type, or undefined when its tags are invalid. */
function describe(graph, name) {
  const tags = graph.nodes[name]?.data?.tags ?? [];
  const scope = tagValue(tags, 'scope:');
  const type = tagValue(tags, 'type:');
  if (!scope || !TYPES.includes(type)) return undefined;
  return { name, scope, type };
}

const isModule = (project) => !PLATFORM_SCOPES.has(project.scope);
const isServerSide = (project) => project.type === 'api' || SERVER_SIDE_PROJECTS.has(project.name);
const isWebSide = (project) => project.type === 'web' || WEB_SIDE_PROJECTS.has(project.name);

function projectViolations(from, to) {
  const violations = [];

  if (to.type === 'app') {
    violations.push(`${from.name} imports the app ${to.name}. Nothing may depend on an app.`);
  }
  if (from.scope === 'core' && to.scope !== 'core') {
    violations.push(`${from.name} imports ${to.name}. Core must not import any module.`);
  }
  if (isModule(from) && isModule(to) && from.scope !== to.scope && to.type !== 'contracts') {
    violations.push(
      `${from.name} imports ${to.name}. Modules may import each other only through contracts.`,
    );
  }
  if (from.type === 'contracts') {
    violations.push(
      `${from.name} imports ${to.name}. Contracts must not import any workspace project.`,
    );
  }
  if (from.type === 'domain' && to.type !== 'contracts') {
    violations.push(`${from.name} imports ${to.name}. Domain may depend only on contracts.`);
  }
  if (isWebSide(from) && isServerSide(to)) {
    violations.push(`${from.name} imports ${to.name}. Browser code must not import server code.`);
  }

  return violations;
}

function packageViolations(from, pkg) {
  const violations = [];

  if (from.type === 'domain' && matchesAny(pkg, FRAMEWORK_PACKAGES)) {
    violations.push(`${from.name} imports ${pkg}. Domain must stay framework-free.`);
  }
  if (from.type === 'contracts' && matchesAny(pkg, FRAMEWORK_PACKAGES)) {
    violations.push(
      `${from.name} imports ${pkg}. Contracts must stay framework-free, because the browser loads them.`,
    );
  }
  if (isWebSide(from) && matchesAny(pkg, SERVER_PACKAGES)) {
    violations.push(`${from.name} imports ${pkg}. Browser code must not import server packages.`);
  }

  return violations;
}

/**
 * Returns one message per broken rule. `graph` is shaped like Nx's
 * ProjectGraph: `nodes` keyed by project name, each with `data.tags`, and
 * `dependencies` mapping a project name to `{ target }` edges.
 */
export function findViolations(graph) {
  const violations = [];

  for (const name of Object.keys(graph.nodes)) {
    if (!describe(graph, name)) {
      const tags = graph.nodes[name]?.data?.tags ?? [];
      violations.push(
        `${name} needs exactly one scope:<name> tag and one type:<${TYPES.join('|')}> tag; it has [${tags.join(', ')}].`,
      );
    }
  }

  for (const [source, edges] of Object.entries(graph.dependencies)) {
    const from = describe(graph, source);
    // External nodes and badly tagged projects: the latter are reported above.
    if (!from) continue;

    for (const { target } of edges) {
      if (target === source) continue;

      if (target.startsWith('npm:')) {
        violations.push(...packageViolations(from, packageName(target)));
        continue;
      }

      const to = describe(graph, target);
      if (to) violations.push(...projectViolations(from, to));
    }
  }

  return violations;
}
