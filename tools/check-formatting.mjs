import fs from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".html",
  ".cjs",
  ".mjs",
]);

async function collectFiles(startDir) {
  const queue = [startDir];
  const files = [];

  while (queue.length > 0) {
    const current = queue.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        if (entry.name === ".github" || entry.name === ".vscode") {
          // Still inspect nested files for workflow definitions etc.
        } else {
          // Skip other dot directories like .cache
          if (entry.isDirectory()) {
            continue;
          }
        }
      }

      const entryPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          queue.push(entryPath);
        }
        continue;
      }

      const ext = path.extname(entry.name);
      if (ALLOWED_EXTENSIONS.has(ext)) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function analyzeFileContent(filePath, content) {
  const issues = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    if (/\s$/.test(line)) {
      issues.push(`${filePath}:${index + 1} has trailing whitespace.`);
    }
    if (/\t/.test(line)) {
      issues.push(`${filePath}:${index + 1} contains tab characters. Use spaces for indentation.`);
    }
  });

  if (!content.endsWith("\n")) {
    issues.push(`${filePath} is missing a terminating newline.`);
  }

  return issues;
}

async function main() {
  const root = process.cwd();
  const targets = [
    path.join(root, ".github"),
    path.join(root, "tools"),
  ];
  const files = [];

  for (const target of targets) {
    try {
      const stats = await fs.stat(target);
      if (stats.isDirectory()) {
        const collected = await collectFiles(target);
        files.push(...collected);
      }
    } catch (error) {
      if (error && error.code !== "ENOENT") {
        throw error;
      }
    }
  }
  const problems = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const fileProblems = analyzeFileContent(path.relative(root, file), content);
    problems.push(...fileProblems);
  }

  if (problems.length > 0) {
    console.error("Formatting check failed. The following issues were found:");
    problems.forEach((problem) => console.error(`  - ${problem}`));
    console.error("Run your preferred formatter to resolve these issues.");
    process.exitCode = 1;
    return;
  }

  console.log("Formatting check passed without issues.");
}

main().catch((error) => {
  console.error("An unexpected error occurred while checking formatting.");
  console.error(error);
  process.exitCode = 1;
});
