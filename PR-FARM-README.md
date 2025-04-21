# GitHub Pull Request Farm

This project automates the creation and management of GitHub pull requests across multiple repositories, creating a "pull request farm." This can be useful for:

- Populating a GitHub profile with activity
- Testing CI/CD workflows
- Creating demo environments
- Training purposes

## Features

- 🏗️ Automatically create multiple repositories
- 🔄 Generate pull requests with meaningful changes
- 💬 Add comments to pull requests
- ✅ Review and approve pull requests
- 🔁 Merge pull requests
- ⏱️ Schedule all operations on customizable intervals

## Prerequisites

- Node.js (v16 or later)
- GitHub account
- GitHub Personal Access Token with repo and workflow permissions

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Copy the configuration file:
   ```bash
   cp .env.pr-farm .env
   ```
4. Edit `.env` and add your:
   - GitHub username
   - GitHub Personal Access Token
   - Custom configuration options

## Usage

### Creating Repositories and PRs

```bash
npm run pr-farm:setup
# or
yarn pr-farm:setup
```

This will:
1. Create the specified number of repositories on your GitHub account
2. Clone each repository locally
3. Create feature branches
4. Make changes to files
5. Commit changes and push to GitHub
6. Create pull requests

### Reviewing and Merging PRs

```bash
npm run pr-farm:review
# or
yarn pr-farm:review
```

This will:
1. Find all open pull requests in your repositories
2. Add comments to the PRs
3. Approve the PRs
4. Merge the PRs (if configured to do so)

### Running Scheduled Operations

```bash
npm run pr-farm:start
# or
yarn pr-farm:start
```

This will start a scheduler that:
1. Runs PR creation at scheduled times (default: daily at 10:00 AM)
2. Runs PR review/merging at scheduled times (default: daily at 2:00 PM)
3. Logs all operations to the logs directory

## Configuration

All configuration is done through environment variables in the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| GITHUB_TOKEN | GitHub Personal Access Token | (required) |
| GITHUB_USERNAME | GitHub username | (required) |
| PR_FARM_REPO_COUNT | Number of repositories to create | 5 |
| PR_FARM_REPO_NAME | Base name for repositories | pr-farm-repo |
| PR_FARM_PRS_PER_REPO | Number of PRs per repository | 3 |
| PR_FARM_AUTO_MERGE | Whether to automatically merge PRs | true |
| PR_FARM_DELAY | Delay between operations (ms) | 2000 |
| PR_FARM_CREATE_SCHEDULE | Cron schedule for PR creation | 0 10 * * * |
| PR_FARM_REVIEW_SCHEDULE | Cron schedule for PR review | 0 14 * * * |
| PR_FARM_RUN_ON_STARTUP | Run tasks on scheduler startup | true |

## Important Notes

- Be mindful of GitHub's rate limits
- Use this tool responsibly and ethically
- Don't use this to spam or abuse GitHub's services
- Consider setting up private repositories if you're going to create many PRs

## License

MIT 