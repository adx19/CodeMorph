import * as vscode from "vscode";
import { EXTENSION_LANGUAGE_MAP, Language } from "./languages";
import { ALLOWED_CONVERSIONS } from "./conversions";

export function activate(context: vscode.ExtensionContext) {
  console.log("CodeMorph activated");
  vscode.window.showInformationMessage("CodeMorph activated ✅");

  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(async (event) => {
      for (const file of event.files) {
        const fromExt = getExtension(file.oldUri);
        const toExt = getExtension(file.newUri);

        if (!fromExt || !toExt || fromExt === toExt) continue;
        if (!isSupportedConversion(fromExt, toExt)) continue;

        await handleConversion(
          file.newUri,
          EXTENSION_LANGUAGE_MAP[fromExt],
          EXTENSION_LANGUAGE_MAP[toExt]
        );
      }
    })
  );
}

function getExtension(uri: vscode.Uri): string | null {
  const parts = uri.path.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : null;
}

function isSupportedConversion(fromExt: string, toExt: string): boolean {
  const fromLang = EXTENSION_LANGUAGE_MAP[fromExt];
  const toLang = EXTENSION_LANGUAGE_MAP[toExt];

  if (!fromLang || !toLang) return false;

  return ALLOWED_CONVERSIONS[fromLang]?.includes(toLang) ?? false;
}

async function handleConversion(
  fileUri: vscode.Uri,
  fromLang: Language,
  toLang: Language
) {
  try {
    const bytes = await vscode.workspace.fs.readFile(fileUri);
    const sourceCode = Buffer.from(bytes).toString("utf8");

    if (!sourceCode.trim()) {
      vscode.window.showWarningMessage("File is empty. Nothing to convert.");
      return;
    }

    const choice = await vscode.window.showInformationMessage(
      `Convert ${fromLang.toUpperCase()} → ${toLang.toUpperCase()} with CodeMorph?`,
      { modal: true },
      "Convert",
      "Cancel"
    );

    if (choice !== "Convert") return;

    const addComments = await vscode.window.showQuickPick(["Yes", "No"], {
      placeHolder: "Add comments to converted code?",
    });

    if (!addComments) return;

    let converted: string;

    try {
      converted = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "CodeMorph is converting your code...",
          cancellable: false,
        },
        async () => {
          return await convertWithAI(
            sourceCode,
            fromLang,
            toLang,
            addComments === "Yes"
          );
        }
      );
    } catch (err: any) {
      vscode.window.showErrorMessage(
        `CodeMorph failed: ${err.message || "Conversion failed."}`
      );
      return;
    }

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      fileUri,
      new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE),
      converted
    );

    await vscode.workspace.applyEdit(edit);

    vscode.window.showInformationMessage("CodeMorph conversion applied ✅");
  } catch {
    vscode.window.showErrorMessage(
      "CodeMorph failed to read or update the file."
    );
  }
}

async function convertWithAI(
  code: string,
  from: Language,
  to: Language,
  withComments: boolean
): Promise<string> {
  const config = vscode.workspace.getConfiguration("codemorph");

  // For now, reuse this setting as "CodeMorph auth token" (JWT)
  const authToken = config.get<string>("geminiApiKey");
  const backendUrl =
    config.get<string>("backendUrl") || "http://localhost:5000";

  if (!authToken) {
    throw new Error(
      "CodeMorph auth token not set (Settings → CodeMorph → geminiApiKey)."
    );
  }

  const prompt = `
Convert the following ${from} code to ${to}.
${withComments ? "Add clear explanatory comments." : "Do not add comments."}
Return ONLY valid ${to} code. No markdown. No explanation.

CODE:
${code}
`;

  const response = await fetch(`${backendUrl}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ prompt }),
  });

  const data: any = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "CodeMorph proxy conversion failed.");
  }

  const text = data?.reply;

  if (!text) {
    throw new Error("CodeMorph did not return valid convertible code. Try again.");
  }

  return stripMarkdown(text);
}


function stripMarkdown(code: string): string {
  return code
    .replace(/```[\s\S]*?\n?/g, "")
    .replace(/```/g, "")
    .trim();
}

export function deactivate() {}
