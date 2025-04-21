const { Octokit } = require("@octokit/rest");
require('dotenv').config();

// Configuration
const config = {
  // GitHub token with repo and workflow permissions
  githubToken: process.env.GITHUB_TOKEN,
  // GitHub username
  username: process.env.GITHUB_USERNAME,
  // Base repository name (will be appended with numbers)
  baseRepoName: process.env.PR_FARM_REPO_NAME || "pr-farm-repo",
  // Number of repositories to process
  repoCount: parseInt(process.env.PR_FARM_REPO_COUNT || '5', 10),
  // Whether to automatically approve and merge PRs
  autoMerge: process.env.PR_FARM_AUTO_MERGE !== 'false',
  // Delay between operations (in ms)
  delay: parseInt(process.env.PR_FARM_DELAY || '2000', 10),
};

if (!config.githubToken || !config.username) {
  console.error("Please set GITHUB_TOKEN and GITHUB_USERNAME in .env file");
  process.exit(1);
}

const octokit = new Octokit({
  auth: config.githubToken,
});

// Utility function to add delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Get open pull requests for a repository
async function getOpenPullRequests(owner, repo) {
  try {
    const response = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      sort: 'created',
      direction: 'asc',
    });
    
    console.log(`Found ${response.data.length} open PRs in ${repo}`);
    return response.data;
  } catch (error) {
    console.error(`Error getting open PRs for ${repo}:`, error.message);
    return [];
  }
}

// Add comment to a pull request
async function commentOnPullRequest(owner, repo, pullNumber, comment) {
  try {
    const response = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pullNumber,
      body: comment,
    });
    
    console.log(`Added comment to PR #${pullNumber} in ${repo}`);
    return response.data;
  } catch (error) {
    console.error(`Error commenting on PR #${pullNumber} in ${repo}:`, error.message);
    return null;
  }
}

// Approve a pull request
async function approvePullRequest(owner, repo, pullNumber) {
  try {
    const response = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      event: 'APPROVE',
      body: 'Looks good! Approving this change.',
    });
    
    console.log(`Approved PR #${pullNumber} in ${repo}`);
    return response.data;
  } catch (error) {
    console.error(`Error approving PR #${pullNumber} in ${repo}:`, error.message);
    return null;
  }
}

// Merge a pull request
async function mergePullRequest(owner, repo, pullNumber) {
  try {
    const response = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullNumber,
      merge_method: 'merge',
    });
    
    console.log(`Merged PR #${pullNumber} in ${repo}`);
    return response.data;
  } catch (error) {
    console.error(`Error merging PR #${pullNumber} in ${repo}:`, error.message);
    return null;
  }
}

// Process pull requests for a repository
async function processPullRequests(owner, repo) {
  const pullRequests = await getOpenPullRequests(owner, repo);
  
  for (const pr of pullRequests) {
    console.log(`Processing PR #${pr.number} - ${pr.title}`);
    
    // Add a comment
    await commentOnPullRequest(
      owner, 
      repo, 
      pr.number, 
      `Thanks for this PR!\n\nI've reviewed the changes and they look good. Processing now...`
    );
    
    await sleep(config.delay);
    
    // Approve the PR
    await approvePullRequest(owner, repo, pr.number);
    
    await sleep(config.delay);
    
    // Merge if configured to do so
    if (config.autoMerge) {
      await mergePullRequest(owner, repo, pr.number);
    }
    
    await sleep(config.delay);
  }
}

// Main function
async function main() {
  for (let i = 1; i <= config.repoCount; i++) {
    const repoName = `${config.baseRepoName}-${i}`;
    console.log(`\nProcessing repository: ${repoName}`);
    
    await processPullRequests(config.username, repoName);
  }
  
  console.log('\nPR Farm review process completed!');
}

main().catch(console.error); 