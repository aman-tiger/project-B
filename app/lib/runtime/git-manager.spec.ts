import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as nodePath from 'node:path';
import { initGitRepo, autoCommit, getGitLog, checkoutCommit, checkoutMain, getCommitFiles } from './git-manager';

const TEST_DIR = nodePath.join(os.tmpdir(), `devonz-git-test-${Date.now()}`);

function rmrf(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('GitManager', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    rmrf(TEST_DIR);
  });

  describe('initGitRepo', () => {
    it('should create a .git directory', () => {
      const result = initGitRepo(TEST_DIR);
      expect(result).toBe(true);
      expect(fs.existsSync(nodePath.join(TEST_DIR, '.git'))).toBe(true);
    });

    it('should create a .gitignore', () => {
      initGitRepo(TEST_DIR);
      expect(fs.existsSync(nodePath.join(TEST_DIR, '.gitignore'))).toBe(true);
    });

    it('should be idempotent', () => {
      initGitRepo(TEST_DIR);

      const result = initGitRepo(TEST_DIR);
      expect(result).toBe(true);
    });

    it('should create an initial commit', () => {
      initGitRepo(TEST_DIR);

      const log = getGitLog(TEST_DIR);
      expect(log.length).toBeGreaterThanOrEqual(1);
      expect(log[0].message).toBe('Initial project');
    });
  });

  describe('autoCommit', () => {
    beforeEach(() => {
      initGitRepo(TEST_DIR);
    });

    it('should return null when nothing to commit', () => {
      const sha = autoCommit(TEST_DIR, 'empty');
      expect(sha).toBeNull();
    });

    it('should commit new files and return SHA', () => {
      fs.writeFileSync(nodePath.join(TEST_DIR, 'hello.txt'), 'world');

      const sha = autoCommit(TEST_DIR, 'Add hello.txt');
      expect(sha).toBeTruthy();
      expect(sha!.length).toBe(40);
    });

    it('should commit modified files', () => {
      fs.writeFileSync(nodePath.join(TEST_DIR, 'file.txt'), 'v1');
      autoCommit(TEST_DIR, 'v1');

      fs.writeFileSync(nodePath.join(TEST_DIR, 'file.txt'), 'v2');

      const sha = autoCommit(TEST_DIR, 'v2');
      expect(sha).toBeTruthy();
    });
  });

  describe('getGitLog', () => {
    beforeEach(() => {
      initGitRepo(TEST_DIR);
    });

    it('should return commits in reverse chronological order', () => {
      fs.writeFileSync(nodePath.join(TEST_DIR, 'a.txt'), 'a');
      autoCommit(TEST_DIR, 'First');

      fs.writeFileSync(nodePath.join(TEST_DIR, 'b.txt'), 'b');
      autoCommit(TEST_DIR, 'Second');

      const log = getGitLog(TEST_DIR);
      expect(log[0].message).toBe('Second');
      expect(log[1].message).toBe('First');
    });

    it('should respect maxCount', () => {
      for (let i = 0; i < 5; i++) {
        fs.writeFileSync(nodePath.join(TEST_DIR, `file${i}.txt`), `${i}`);
        autoCommit(TEST_DIR, `Commit ${i}`);
      }

      const log = getGitLog(TEST_DIR, 3);
      expect(log.length).toBe(3);
    });

    it('should include correct fields', () => {
      fs.writeFileSync(nodePath.join(TEST_DIR, 'test.txt'), 'test');
      autoCommit(TEST_DIR, 'Test commit');

      const log = getGitLog(TEST_DIR, 1);
      expect(log[0]).toHaveProperty('sha');
      expect(log[0]).toHaveProperty('shortSha');
      expect(log[0]).toHaveProperty('message', 'Test commit');
      expect(log[0]).toHaveProperty('timestamp');
      expect(log[0]).toHaveProperty('isoDate');
      expect(log[0].sha.length).toBe(40);
      expect(log[0].shortSha.length).toBe(7);
    });
  });

  describe('checkoutCommit', () => {
    beforeEach(() => {
      initGitRepo(TEST_DIR);
    });

    it('should checkout a previous commit', () => {
      fs.writeFileSync(nodePath.join(TEST_DIR, 'file.txt'), 'v1');
      autoCommit(TEST_DIR, 'v1');

      const log1 = getGitLog(TEST_DIR);

      fs.writeFileSync(nodePath.join(TEST_DIR, 'file.txt'), 'v2');
      autoCommit(TEST_DIR, 'v2');

      const success = checkoutCommit(TEST_DIR, log1[0].sha);
      expect(success).toBe(true);

      const content = fs.readFileSync(nodePath.join(TEST_DIR, 'file.txt'), 'utf-8');
      expect(content).toBe('v1');
    });
  });

  describe('checkoutMain', () => {
    beforeEach(() => {
      initGitRepo(TEST_DIR);
    });

    it('should return to main branch after detached HEAD', () => {
      fs.writeFileSync(nodePath.join(TEST_DIR, 'file.txt'), 'v1');
      autoCommit(TEST_DIR, 'v1');

      const log1 = getGitLog(TEST_DIR);

      fs.writeFileSync(nodePath.join(TEST_DIR, 'file.txt'), 'v2');
      autoCommit(TEST_DIR, 'v2');

      checkoutCommit(TEST_DIR, log1[0].sha);

      const success = checkoutMain(TEST_DIR);
      expect(success).toBe(true);

      const content = fs.readFileSync(nodePath.join(TEST_DIR, 'file.txt'), 'utf-8');
      expect(content).toBe('v2');
    });
  });

  describe('getCommitFiles', () => {
    beforeEach(() => {
      initGitRepo(TEST_DIR);
    });

    it('should return files changed in a commit', () => {
      fs.writeFileSync(nodePath.join(TEST_DIR, 'a.txt'), 'a');
      fs.writeFileSync(nodePath.join(TEST_DIR, 'b.txt'), 'b');
      autoCommit(TEST_DIR, 'Add files');

      const log = getGitLog(TEST_DIR, 1);
      const files = getCommitFiles(TEST_DIR, log[0].sha);
      expect(files).toContain('a.txt');
      expect(files).toContain('b.txt');
    });
  });
});
