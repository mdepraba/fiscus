import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findViolations } from './rules.mjs';

const TAGS = {
  '@app/api': ['scope:app', 'type:app'],
  '@app/fiscus-web': ['scope:app', 'type:app'],
  '@core/api': ['scope:core', 'type:core'],
  '@core/db': ['scope:core', 'type:core'],
  '@core/ui': ['scope:core', 'type:core'],
  '@fiscus/contracts': ['scope:fiscus', 'type:contracts'],
  '@fiscus/domain': ['scope:fiscus', 'type:domain'],
  '@fiscus/api': ['scope:fiscus', 'type:api'],
  '@fiscus/web': ['scope:fiscus', 'type:web'],
  '@demo/contracts': ['scope:demo', 'type:contracts'],
  '@demo/api': ['scope:demo', 'type:api'],
  '@demo/web': ['scope:demo', 'type:web'],
};

/**
 * Mirrors the workspace dependencies each project's package.json declares,
 * plus a synthetic `demo` module, so the cross-module rules have a second
 * module to test against. No app imports it.
 */
const EDGES = {
  '@app/api': ['@core/api', '@fiscus/api', 'npm:@nestjs/core'],
  '@app/fiscus-web': ['@core/ui', '@fiscus/web', 'npm:react'],
  '@core/api': ['@core/db', 'npm:@nestjs/common'],
  '@core/ui': ['npm:react'],
  '@fiscus/domain': ['@fiscus/contracts'],
  '@fiscus/api': ['@core/api', '@fiscus/domain', '@fiscus/contracts'],
  '@fiscus/web': ['@core/ui', '@fiscus/contracts', 'npm:react'],
  '@demo/api': ['@core/api', '@demo/contracts'],
  '@demo/web': ['@core/ui', '@demo/contracts'],
};

function graph({ tags = TAGS, edges = EDGES } = {}) {
  return {
    nodes: Object.fromEntries(
      Object.entries(tags).map(([name, projectTags]) => [
        name,
        { name, data: { tags: projectTags } },
      ]),
    ),
    dependencies: Object.fromEntries(
      Object.keys(tags).map((name) => [
        name,
        (edges[name] ?? []).map((target) => ({ source: name, target })),
      ]),
    ),
  };
}

/** The shipped layout plus one extra edge. */
function withEdge(source, target) {
  return graph({
    edges: { ...EDGES, [source]: [...(EDGES[source] ?? []), target] },
  });
}

function assertViolation(input, pattern) {
  const violations = findViolations(input);
  assert.ok(
    violations.some((violation) => pattern.test(violation)),
    `Expected a violation matching ${pattern}, got:\n${violations.join('\n')}`,
  );
}

describe('findViolations', () => {
  it('accepts the shipped layout', () => {
    assert.deepEqual(findViolations(graph()), []);
  });

  describe('tags', () => {
    it('rejects an untagged project', () => {
      assertViolation(
        graph({ tags: { ...TAGS, '@fiscus/web': [] } }),
        /@fiscus\/web needs exactly one scope/,
      );
    });

    it('rejects two type tags', () => {
      assertViolation(
        graph({
          tags: { ...TAGS, '@fiscus/web': ['scope:fiscus', 'type:web', 'type:api'] },
        }),
        /@fiscus\/web needs exactly one scope/,
      );
    });

    it('rejects an unknown type', () => {
      assertViolation(
        graph({ tags: { ...TAGS, '@fiscus/web': ['scope:fiscus', 'type:lib'] } }),
        /@fiscus\/web needs exactly one scope/,
      );
    });
  });

  it('rejects any import of an app', () => {
    assertViolation(withEdge('@core/api', '@app/api'), /Nothing may depend on an app/);
  });

  it('rejects core importing a module', () => {
    assertViolation(withEdge('@core/ui', '@fiscus/contracts'), /Core must not import any module/);
  });

  describe('cross-module imports', () => {
    it('rejects reaching past contracts', () => {
      assertViolation(withEdge('@demo/api', '@fiscus/domain'), /only through contracts/);
    });

    it('accepts another module’s contracts', () => {
      assert.deepEqual(findViolations(withEdge('@demo/api', '@fiscus/contracts')), []);
    });
  });

  describe('contracts', () => {
    it('rejects a workspace project', () => {
      assertViolation(
        withEdge('@fiscus/contracts', '@core/db'),
        /Contracts must not import any workspace project/,
      );
    });

    it('rejects a framework package', () => {
      assertViolation(
        withEdge('@fiscus/contracts', 'npm:@nestjs/common'),
        /Contracts must stay framework-free/,
      );
      assertViolation(
        withEdge('@fiscus/contracts', 'npm:react@19.3.0'),
        /Contracts must stay framework-free/,
      );
      assertViolation(
        withEdge('@fiscus/contracts', 'npm:pg'),
        /Contracts must stay framework-free/,
      );
    });

    it('accepts a validation library', () => {
      assert.deepEqual(findViolations(withEdge('@fiscus/contracts', 'npm:zod')), []);
    });
  });

  describe('domain', () => {
    it('rejects a non-contracts project', () => {
      assertViolation(
        withEdge('@fiscus/domain', '@core/api'),
        /Domain may depend only on contracts/,
      );
    });

    it('rejects a framework package, with or without a version suffix', () => {
      assertViolation(withEdge('@fiscus/domain', 'npm:@nestjs/common'), /framework-free/);
      assertViolation(withEdge('@fiscus/domain', 'npm:react@19.3.0'), /framework-free/);
    });

    it('rejects pg, the driver under Drizzle and pg-boss', () => {
      assertViolation(withEdge('@fiscus/domain', 'npm:pg'), /framework-free/);
    });

    it('accepts a package that only shares a prefix with one', () => {
      assert.deepEqual(findViolations(withEdge('@fiscus/domain', 'npm:postgres-array')), []);
      assert.deepEqual(findViolations(withEdge('@fiscus/domain', 'npm:pg-protocol-docs')), []);
    });
  });

  describe('browser code', () => {
    it('rejects importing an api project', () => {
      assertViolation(
        withEdge('@fiscus/web', '@fiscus/api'),
        /Browser code must not import server code/,
      );
    });

    it('rejects importing core/db from the shell', () => {
      assertViolation(
        withEdge('@app/fiscus-web', '@core/db'),
        /Browser code must not import server code/,
      );
    });

    it('rejects a server package', () => {
      assertViolation(
        withEdge('@core/ui', 'npm:fastify'),
        /Browser code must not import server packages/,
      );
    });

    it('rejects pg, drizzle-kit, nodemailer and the WebAuthn server half', () => {
      for (const pkg of ['pg', 'drizzle-kit', 'nodemailer', '@simplewebauthn/server']) {
        assertViolation(
          withEdge('@fiscus/web', `npm:${pkg}`),
          /Browser code must not import server packages/,
        );
      }
    });

    it('accepts the WebAuthn browser half', () => {
      assert.deepEqual(
        findViolations(withEdge('@app/fiscus-web', 'npm:@simplewebauthn/browser')),
        [],
      );
    });
  });
});
