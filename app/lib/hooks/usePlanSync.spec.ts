import { describe, it, expect } from 'vitest';
import { parsePlanMd } from './usePlanSync';

describe('parsePlanMd', () => {
  it('should parse a plan with title and checkboxes', () => {
    const content = `# Todo App Plan

- [x] Set up project structure
- [x] Create main component
- [ ] Add styling
- [ ] Add tests
`;
    const result = parsePlanMd(content);

    expect(result.title).toBe('Todo App Plan');
    expect(result.tasks).toHaveLength(4);
    expect(result.tasks[0]).toEqual({
      id: 'plan-task-0',
      title: 'Set up project structure',
      status: 'completed',
    });
    expect(result.tasks[1]).toEqual({
      id: 'plan-task-1',
      title: 'Create main component',
      status: 'completed',
    });
    expect(result.tasks[2]).toEqual({
      id: 'plan-task-2',
      title: 'Add styling',
      status: 'not-started',
    });
    expect(result.tasks[3]).toEqual({
      id: 'plan-task-3',
      title: 'Add tests',
      status: 'not-started',
    });
  });

  it('should handle uppercase X in checkboxes', () => {
    const content = `- [X] Completed task
- [ ] Pending task`;

    const result = parsePlanMd(content);

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].status).toBe('completed');
    expect(result.tasks[1].status).toBe('not-started');
  });

  it('should handle content without a title', () => {
    const content = `- [ ] Task one
- [x] Task two`;

    const result = parsePlanMd(content);

    expect(result.title).toBeUndefined();
    expect(result.tasks).toHaveLength(2);
  });

  it('should return empty tasks for non-checkbox content', () => {
    const content = `# My Plan

Some description text
- Regular bullet item
Another line`;

    const result = parsePlanMd(content);

    expect(result.title).toBe('My Plan');
    expect(result.tasks).toHaveLength(0);
  });

  it('should handle empty content', () => {
    const result = parsePlanMd('');

    expect(result.title).toBeUndefined();
    expect(result.tasks).toHaveLength(0);
  });

  it('should handle asterisk-style checkboxes', () => {
    const content = `* [x] Asterisk completed
* [ ] Asterisk pending`;

    const result = parsePlanMd(content);

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].status).toBe('completed');
    expect(result.tasks[0].title).toBe('Asterisk completed');
  });

  it('should handle indented checkboxes', () => {
    const content = `# Plan

  - [ ] Indented task
    - [x] Deeply indented task`;

    const result = parsePlanMd(content);

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].title).toBe('Indented task');
    expect(result.tasks[1].title).toBe('Deeply indented task');
    expect(result.tasks[1].status).toBe('completed');
  });

  it('should handle multiple heading levels for title', () => {
    const content = `## Implementation Plan

- [ ] First task`;

    const result = parsePlanMd(content);

    expect(result.title).toBe('Implementation Plan');
    expect(result.tasks).toHaveLength(1);
  });

  it('should only use the first heading as title', () => {
    const content = `# Main Plan

## Sub-section

- [x] Task under sub-section`;

    const result = parsePlanMd(content);

    expect(result.title).toBe('Main Plan');
    expect(result.tasks).toHaveLength(1);
  });
});
