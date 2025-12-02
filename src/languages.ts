export type Language =
  | "python"
  | "java"
  | "javascript"
  | "typescript"
  | "c"
  | "cpp"
  | "csharp"
  | "go"
  | "rust"
  | "kotlin"
  | "dart"
  | "ruby"
  | "php"
  | "bash"
  | "powershell"
  | "lua"
  | "perl"
  | "r";

/**
 * File extension → language mapping
 */
export const EXTENSION_LANGUAGE_MAP: Record<string, Language> = {
  py: "python",
  java: "java",
  js: "javascript",
  ts: "typescript",
  c: "c",
  cpp: "cpp",
  cs: "csharp",
  go: "go",
  rs: "rust",
  kt: "kotlin",
  dart: "dart",
  rb: "ruby",
  php: "php",
  sh: "bash",
  ps1: "powershell",
  lua: "lua",
  pl: "perl",
  r: "r",
};
