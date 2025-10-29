/**
 * GitHub Client
 *
 * Handles all GitHub operations for PROJECT management
 */

import { Octokit } from '@octokit/rest';
import type { GitHubRepo, PullRequest, GitHubBranch } from '@/types/project';

export interface CodeFile {
  path: string;
  content: string;
}

export interface CreatePROptions {
  title: string;
  body: string;
  head: string;
  base: string;
}

/**
 * GitHubClient - Manages GitHub repository operations
 */
export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(repoUrl: string, accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
    const parsed = this.parseRepoUrl(repoUrl);
    this.owner = parsed.owner;
    this.repo = parsed.name;
  }

  /**
   * Parse GitHub repository URL
   */
  private parseRepoUrl(url: string): { owner: string; name: string } {
    // Support formats:
    // - https://github.com/owner/repo
    // - https://github.com/owner/repo.git
    // - github.com/owner/repo
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);

    if (!match) {
      throw new Error(`Invalid GitHub repository URL: ${url}`);
    }

    return {
      owner: match[1],
      name: match[2],
    };
  }

  /**
   * Verify repository access
   */
  async verifyAccess(): Promise<boolean> {
    try {
      await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });
      return true;
    } catch (error) {
      console.error('Failed to verify GitHub repository access:', error);
      return false;
    }
  }

  /**
   * Get repository information
   */
  async getRepoInfo(): Promise<GitHubRepo | null> {
    try {
      const { data } = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      });

      return {
        url: data.html_url,
        owner: this.owner,
        name: this.repo,
        branch: data.default_branch,
      };
    } catch (error) {
      console.error('Failed to get repository info:', error);
      return null;
    }
  }

  /**
   * Create a new branch from base branch
   */
  async createBranch(branchName: string, fromBranch: string = 'main'): Promise<void> {
    try {
      // 1. Get the latest commit SHA from the base branch
      const { data: ref } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${fromBranch}`,
      });

      // 2. Create the new branch
      await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branchName}`,
        sha: ref.object.sha,
      });

      console.log(`✅ Created branch: ${branchName}`);
    } catch (error: any) {
      // Branch might already exist
      if (error.status === 422) {
        console.log(`ℹ️ Branch ${branchName} already exists`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Check if a branch exists
   */
  async branchExists(branchName: string): Promise<boolean> {
    try {
      await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get branch information
   */
  async getBranch(branchName: string): Promise<GitHubBranch | null> {
    try {
      const { data: ref } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });

      const { data: branch } = await this.octokit.repos.getBranch({
        owner: this.owner,
        repo: this.repo,
        branch: branchName,
      });

      return {
        name: branchName,
        sha: ref.object.sha,
        protected: branch.protected,
      };
    } catch (error) {
      console.error(`Failed to get branch ${branchName}:`, error);
      return null;
    }
  }

  /**
   * Write a single file to the repository
   */
  async writeFile(
    path: string,
    content: string,
    branch: string,
    message: string = `Update ${path}`
  ): Promise<void> {
    try {
      // Try to get existing file
      let sha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path,
          ref: branch,
        });

        if ('sha' in data) {
          sha = data.sha;
        }
      } catch (error: any) {
        // File doesn't exist, sha will be undefined
        if (error.status !== 404) {
          throw error;
        }
      }

      // Create or update file
      await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        sha,
        branch,
      });

      console.log(`✅ Wrote file: ${path} to branch ${branch}`);
    } catch (error) {
      console.error(`Failed to write file ${path}:`, error);
      throw error;
    }
  }

  /**
   * Write multiple files to the repository
   */
  async writeFiles(
    files: CodeFile[],
    branch: string,
    commitMessage: string = 'Update files'
  ): Promise<void> {
    try {
      for (const file of files) {
        await this.writeFile(file.path, file.content, branch, commitMessage);
      }

      console.log(`✅ Wrote ${files.length} files to branch ${branch}`);
    } catch (error) {
      console.error('Failed to write files:', error);
      throw error;
    }
  }

  /**
   * Create a Pull Request
   */
  async createPullRequest(options: CreatePROptions): Promise<PullRequest> {
    try {
      const { data } = await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: options.title,
        body: options.body,
        head: options.head,
        base: options.base,
      });

      console.log(`✅ Created PR #${data.number}: ${data.title}`);

      return {
        number: data.number,
        url: data.html_url,
        status: data.state,
        title: data.title,
        body: data.body || '',
      };
    } catch (error) {
      console.error('Failed to create pull request:', error);
      throw error;
    }
  }

  /**
   * Get Pull Request information
   */
  async getPullRequest(prNumber: number): Promise<PullRequest | null> {
    try {
      const { data } = await this.octokit.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
      });

      return {
        number: data.number,
        url: data.html_url,
        status: data.state,
        title: data.title,
        body: data.body || '',
      };
    } catch (error) {
      console.error(`Failed to get PR #${prNumber}:`, error);
      return null;
    }
  }

  /**
   * Merge a Pull Request
   */
  async mergePullRequest(
    prNumber: number,
    mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash'
  ): Promise<boolean> {
    try {
      await this.octokit.pulls.merge({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        merge_method: mergeMethod,
      });

      console.log(`✅ Merged PR #${prNumber}`);
      return true;
    } catch (error) {
      console.error(`Failed to merge PR #${prNumber}:`, error);
      return false;
    }
  }

  /**
   * Check if PR has merge conflicts
   */
  async checkMergeConflicts(prNumber: number): Promise<boolean> {
    try {
      const { data } = await this.octokit.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
      });

      // mergeable is null when GitHub is computing, false when conflicts exist
      return data.mergeable === false;
    } catch (error) {
      console.error(`Failed to check conflicts for PR #${prNumber}:`, error);
      return false;
    }
  }

  /**
   * Get conflicting files in a PR
   */
  async getConflictingFiles(prNumber: number): Promise<string[]> {
    try {
      const { data: files } = await this.octokit.pulls.listFiles({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
      });

      // Note: GitHub API doesn't directly expose conflict status in file list
      // We return all modified files that might have conflicts
      // To properly detect conflicts, use checkMergeConflicts first
      return files
        .filter(file => file.status === 'modified' || file.status === 'changed')
        .map(file => file.filename);
    } catch (error) {
      console.error(`Failed to get conflicting files for PR #${prNumber}:`, error);
      return [];
    }
  }

  /**
   * List branches in the repository
   */
  async listBranches(): Promise<string[]> {
    try {
      const { data: branches } = await this.octokit.repos.listBranches({
        owner: this.owner,
        repo: this.repo,
      });

      return branches.map(branch => branch.name);
    } catch (error) {
      console.error('Failed to list branches:', error);
      return [];
    }
  }

  /**
   * Delete a branch
   */
  async deleteBranch(branchName: string): Promise<boolean> {
    try {
      await this.octokit.git.deleteRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branchName}`,
      });

      console.log(`✅ Deleted branch: ${branchName}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete branch ${branchName}:`, error);
      return false;
    }
  }

  /**
   * Get file content from repository
   */
  async getFileContent(path: string, branch: string = 'main'): Promise<string | null> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: branch,
      });

      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return null;
    } catch (error) {
      console.error(`Failed to get file content for ${path}:`, error);
      return null;
    }
  }

  /**
   * Get repository file tree
   */
  async getTree(branch: string = 'main', recursive: boolean = true): Promise<any[]> {
    try {
      const { data: ref } = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
      });

      const { data: tree } = await this.octokit.git.getTree({
        owner: this.owner,
        repo: this.repo,
        tree_sha: ref.object.sha,
        recursive: recursive ? 'true' : undefined,
      });

      return tree.tree;
    } catch (error) {
      console.error('Failed to get repository tree:', error);
      return [];
    }
  }
}

/**
 * Verify GitHub access token
 */
export async function verifyGitHubToken(token: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.users.getAuthenticated();
    return true;
  } catch (error) {
    console.error('Failed to verify GitHub token:', error);
    return false;
  }
}

/**
 * Get authenticated user info
 */
export async function getGitHubUser(token: string): Promise<any | null> {
  try {
    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.users.getAuthenticated();
    return data;
  } catch (error) {
    console.error('Failed to get GitHub user:', error);
    return null;
  }
}
