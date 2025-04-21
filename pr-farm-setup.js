const { Octokit } = require("@octokit/rest");
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Configuration
const config = {
  // GitHub token with repo and workflow permissions
  githubToken: process.env.GITHUB_TOKEN,
  // GitHub username
  username: process.env.GITHUB_USERNAME,
  // Number of repositories to create
  repoCount: parseInt(process.env.PR_FARM_REPO_COUNT || '5', 10),
  // Base repository name (will be appended with numbers)
  baseRepoName: process.env.PR_FARM_REPO_NAME || "pr-farm-repo",
  // Number of PRs to create per repository
  prsPerRepo: parseInt(process.env.PR_FARM_PRS_PER_REPO || '3', 10),
};

if (!config.githubToken || !config.username) {
  console.error("Please set GITHUB_TOKEN and GITHUB_USERNAME in .env file");
  process.exit(1);
}

const octokit = new Octokit({
  auth: config.githubToken,
});

// Create a repository
async function createRepository(name) {
  try {
    const response = await octokit.repos.createForAuthenticatedUser({
      name,
      auto_init: true,
      private: false,
      description: `PR Farm Repository ${name}`,
    });
    
    console.log(`Repository created: ${response.data.html_url}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating repository ${name}:`, error.message);
    return null;
  }
}

// Clone a repository
function cloneRepository(repoUrl, localPath) {
  try {
    execSync(`git clone ${repoUrl} ${localPath}`, { stdio: 'inherit' });
    console.log(`Repository cloned to ${localPath}`);
    return true;
  } catch (error) {
    console.error(`Error cloning repository:`, error.message);
    return false;
  }
}

// Create a branch
function createBranch(localPath, branchName) {
  try {
    process.chdir(localPath);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
    console.log(`Created branch: ${branchName}`);
    return true;
  } catch (error) {
    console.error(`Error creating branch ${branchName}:`, error.message);
    return false;
  }
}

// Make changes to files
function makeChanges(localPath, prNumber) {
  try {
    const filePath = path.join(localPath, `feature-${prNumber}.md`);
    fs.writeFileSync(filePath, `# Feature ${prNumber}\n\nThis is a change for PR #${prNumber}\n\nCreated at: ${new Date().toISOString()}`);
    console.log(`Created file: ${filePath}`);
    
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Add feature ${prNumber}"`, { stdio: 'inherit' });
    console.log(`Changes committed`);
    return true;
  } catch (error) {
    console.error(`Error making changes:`, error.message);
    return false;
  }
}

// Push changes and create PR
async function pushAndCreatePR(repoName, branchName, prNumber) {
  try {
    execSync(`git push origin ${branchName}`, { stdio: 'inherit' });
    console.log(`Pushed branch: ${branchName}`);
    
    const response = await octokit.pulls.create({
      owner: config.username,
      repo: repoName,
      title: `Feature Request #${prNumber}`,
      body: `This is a pull request for feature #${prNumber}.\n\nCreated by PR Farm.`,
      head: branchName,
      base: 'main',
    });
    
    console.log(`PR created: ${response.data.html_url}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating PR:`, error.message);
    return null;
  }
}

// Main function
async function main() {
  const tempDir = path.join(__dirname, 'pr-farm-temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  for (let i = 1; i <= config.repoCount; i++) {
    const repoName = `${config.baseRepoName}-${i}`;
    const repo = await createRepository(repoName);
    
    if (!repo) continue;
    
    const repoUrl = repo.clone_url.replace('https://', `https://${config.githubToken}@`);
    const localPath = path.join(tempDir, repoName);
    
    const cloned = cloneRepository(repoUrl, localPath);
    if (!cloned) continue;
    
    for (let j = 1; j <= config.prsPerRepo; j++) {
      const branchName = `feature-${j}`;
      const branchCreated = createBranch(localPath, branchName);
      if (!branchCreated) continue;
      
      const changesCreated = makeChanges(localPath, j);
      if (!changesCreated) continue;
      
      await pushAndCreatePR(repoName, branchName, j);
      
      // Go back to main branch
      execSync('git checkout main', { stdio: 'inherit' });
    }
  }
  
  console.log('PR Farm setup completed!');
}

main().catch(console.error); 