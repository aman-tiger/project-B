import { describe, it, expect } from 'vitest';
import { detectProjectCommands } from './projectCommands';

describe('detectProjectCommands', () => {
  it('should use npx next dev for Next.js projects', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
          dependencies: { next: '16.0.10', react: '^19' },
        }),
      },
    ];

    const result = await detectProjectCommands(files);

    expect(result.startCommand).toBe('npx next dev');
    expect(result.type).toBe('Node.js');
  });

  it('should use npx vite for Vite projects', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'vite', build: 'vite build' },
          dependencies: { vite: '^5.0.0', react: '^18' },
        }),
      },
    ];

    const result = await detectProjectCommands(files);

    expect(result.startCommand).toBe('npx vite');
  });

  it('should preserve args and add --turbopack when using npx next (e.g. next dev --turbo)', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'next dev --turbo' },
          dependencies: { next: '15.0.0' },
        }),
      },
    ];

    const result = await detectProjectCommands(files);

    expect(result.startCommand).toBe('npx next dev --turbo');
  });

  it('should fallback to npm run for complex/unrecognized scripts', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'concurrently "npm:server" "npm:client"' },
          dependencies: { concurrently: '^8' },
        }),
      },
    ];

    const result = await detectProjectCommands(files);

    expect(result.startCommand).toBe('npm run dev');
  });

  it('should detect static projects with index.html', async () => {
    const files = [{ path: 'index.html', content: '<html></html>' }];

    const result = await detectProjectCommands(files);

    expect(result.type).toBe('Static');
    expect(result.startCommand).toBe('npx --yes serve');
  });

  it('should include shadcn init for new shadcn projects without existing components', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'next dev' },
          dependencies: { next: '15.0.0' },
        }),
      },
      {
        path: 'components.json',
        content: JSON.stringify({ $schema: 'https://ui.shadcn.com/schema.json' }),
      },
    ];

    const result = await detectProjectCommands(files);

    expect(result.setupCommand).toContain('shadcn');

    // Setup should be simple: npm install && npx shadcn init (no env var export prefix)
    expect(result.setupCommand).toBe('npm install && npx --yes shadcn@latest init --defaults');
  });

  it('should skip shadcn init for imported templates with existing components', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'next dev' },
          dependencies: { next: '15.0.0' },
        }),
      },
      {
        path: 'components.json',
        content: JSON.stringify({ $schema: 'https://ui.shadcn.com/schema.json' }),
      },
      {
        path: 'components/ui/button.tsx',
        content: 'export function Button() { return <button />; }',
      },
    ];

    const result = await detectProjectCommands(files);

    expect(result.setupCommand).not.toContain('shadcn');
  });

  it('should handle empty projects gracefully', async () => {
    const result = await detectProjectCommands([]);

    expect(result.type).toBe('');
  });

  it('should use npx nuxt dev for Nuxt projects', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'nuxt dev' },
          dependencies: { nuxt: '^3' },
        }),
      },
    ];

    const result = await detectProjectCommands(files);

    expect(result.startCommand).toBe('npx nuxt dev');
  });

  it('should use npx astro dev for Astro projects', async () => {
    const files = [
      {
        path: 'package.json',
        content: JSON.stringify({
          scripts: { dev: 'astro dev' },
          dependencies: { astro: '^4' },
        }),
      },
    ];

    const result = await detectProjectCommands(files);

    expect(result.startCommand).toBe('npx astro dev');
  });
});
