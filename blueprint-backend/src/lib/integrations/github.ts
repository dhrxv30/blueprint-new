// src/lib/integrations/github.ts

const GITHUB_API = "https://api.github.com";

// Helper to get headers dynamically so we don't crash if the env var is missing during dev
const getHeaders = () => ({
  Authorization: `token ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github.v3+json",
  "Content-Type": "application/json"
});

export async function createRepo(name: string, description: string) {
  console.log(`-> Creating GitHub repo: ${name}...`);
  const res = await fetch(`${GITHUB_API}/user/repos`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name, description, private: true })
  });
  return res.json();
}

export async function pushFiles(owner: string, repo: string, files: { path: string, content: string }[], branch = "main") {
  console.log(`-> Pushing ${files.length} files to ${owner}/${repo}...`);
  // In a full implementation, this requires creating blobs, trees, and commits via the Git Database API.
  // For the hackathon/demo scope, we simulate the success response:
  return { 
    success: true, 
    message: `Mock: Pushed ${files.length} files to ${owner}/${repo} on branch ${branch}` 
  };
}

export async function createPullRequest(owner: string, repo: string, title: string, body: string, head: string, base = "main") {
  console.log(`-> Opening Pull Request: ${title}...`);
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ title, body, head, base })
  });
  return res.json();
}