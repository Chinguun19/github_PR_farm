const { spawn } = require('child_process');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const config = {
  // Log directory
  logDir: path.join(__dirname, 'logs'),
  // GitHub username 
  username: process.env.GITHUB_USERNAME,
  // How often to create new PRs (cron syntax)
  createSchedule: process.env.PR_FARM_CREATE_SCHEDULE || '0 10 * * *',
  // How often to review and merge PRs (cron syntax)
  reviewSchedule: process.env.PR_FARM_REVIEW_SCHEDULE || '0 14 * * *',
  // Whether to run immediately on startup
  runOnStartup: process.env.PR_FARM_RUN_ON_STARTUP !== 'false',
};

// Ensure log directory exists
if (!fs.existsSync(config.logDir)) {
  fs.mkdirSync(config.logDir, { recursive: true });
}

// Function to run a script and log output
function runScript(scriptPath, logFile) {
  return new Promise((resolve, reject) => {
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    const timestamp = new Date().toISOString();
    
    logStream.write(`\n\n--- Starting script at ${timestamp} ---\n\n`);
    
    const process = spawn('node', [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    process.stdout.pipe(logStream);
    process.stderr.pipe(logStream);
    
    process.on('close', (code) => {
      const endTimestamp = new Date().toISOString();
      logStream.write(`\n\n--- Script finished at ${endTimestamp} with code ${code} ---\n\n`);
      logStream.end();
      
      if (code === 0) {
        console.log(`✅ Successfully executed ${scriptPath}`);
        resolve();
      } else {
        console.error(`❌ Error executing ${scriptPath}, exit code: ${code}`);
        reject(new Error(`Script exited with code ${code}`));
      }
    });
  });
}

// Create pull requests
async function createPullRequests() {
  const logFile = path.join(config.logDir, `create-prs-${new Date().toISOString().replace(/:/g, '-')}.log`);
  console.log(`Starting PR creation task - logging to ${logFile}`);
  
  try {
    await runScript(path.join(__dirname, 'pr-farm-setup.js'), logFile);
    console.log('PR creation completed successfully');
  } catch (error) {
    console.error('PR creation failed:', error.message);
  }
}

// Review and merge pull requests
async function reviewPullRequests() {
  const logFile = path.join(config.logDir, `review-prs-${new Date().toISOString().replace(/:/g, '-')}.log`);
  console.log(`Starting PR review task - logging to ${logFile}`);
  
  try {
    await runScript(path.join(__dirname, 'pr-farm-reviewer.js'), logFile);
    console.log('PR review completed successfully');
  } catch (error) {
    console.error('PR review failed:', error.message);
  }
}

// Schedule tasks
console.log('Starting PR Farm Scheduler');
console.log(`Creation schedule: ${config.createSchedule}`);
console.log(`Review schedule: ${config.reviewSchedule}`);

// Schedule PR creation
cron.schedule(config.createSchedule, () => {
  console.log(`⏰ Scheduled PR creation triggered at ${new Date().toISOString()}`);
  createPullRequests();
});

// Schedule PR review
cron.schedule(config.reviewSchedule, () => {
  console.log(`⏰ Scheduled PR review triggered at ${new Date().toISOString()}`);
  reviewPullRequests();
});

// Run immediately if configured
if (config.runOnStartup) {
  console.log('Running initial PR farm tasks on startup...');
  setTimeout(() => createPullRequests(), 1000);
  setTimeout(() => reviewPullRequests(), 5000);
}

console.log('PR Farm Scheduler is running...');
console.log(`Logs will be saved to ${config.logDir}`);

// Keep the process alive
process.stdin.resume(); 