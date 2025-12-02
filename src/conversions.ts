import { Language } from "./languages";

/**
 * Strict allowed conversions (Category A & B only)
 */export const ALLOWED_CONVERSIONS: Record<Language, Language[]> = {
  // Category A – General Purpose
  python: [
    "java",
    "javascript",
    "typescript",
    "cpp",
    "go",
    "ruby",
    "php",
    "bash",
    "r",
    "lua",
    "perl",
  ],
  java: ["python", "kotlin", "csharp"],
  javascript: ["typescript", "python", "dart"],
  typescript: ["javascript", "python"],
  c: ["cpp"],
  cpp: ["c", "rust", "python"],
  csharp: [],             // ✅ FIX
  go: ["python", "rust"],
  rust: ["cpp", "go"],
  kotlin: ["java"],
  dart: ["javascript"],
  ruby: ["python"],
  php: ["python"],

  // Category B – Scripting / Automation
  bash: ["powershell", "python"],
  powershell: ["bash"],
  lua: ["python"],
  perl: ["python"],
  r: ["python"],
};
