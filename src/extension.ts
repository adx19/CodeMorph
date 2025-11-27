import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('CodeMorph activated');
    vscode.window.showInformationMessage('CodeMorph activated ✅');

    context.subscriptions.push(
        vscode.workspace.onDidRenameFiles(async (event) => {
            for (const file of event.files) {
                const fromExt = getExtension(file.oldUri);
                const toExt = getExtension(file.newUri);

                if (!fromExt || !toExt || fromExt === toExt) continue;
                if (!isSupportedConversion(fromExt, toExt)) continue;

                await handleConversion(file.newUri, fromExt, toExt);
            }
        })
    );
}

function getExtension(uri: vscode.Uri): string | null {
    const parts = uri.path.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : null;
}

function isSupportedConversion(from: string, to: string): boolean {
    return (from === 'java' && to === 'py') || (from === 'py' && to === 'java');
}

async function handleConversion(
    fileUri: vscode.Uri,
    fromExt: string,
    toExt: string
) {
    const choice = await vscode.window.showInformationMessage(
        `Convert ${fromExt.toUpperCase()} → ${toExt.toUpperCase()} with CodeMorph?`,
        { modal: true },
        'Convert', 'Cancel'
    );

    if (choice !== 'Convert') return;

    const addComments = await vscode.window.showQuickPick(
        ['Yes', 'No'],
        { placeHolder: 'Add comments to converted code?' }
    );

    const bytes = await vscode.workspace.fs.readFile(fileUri);
    const sourceCode = Buffer.from(bytes).toString('utf8');

    const converted = await convertWithAI(
        sourceCode,
        fromExt,
        toExt,
        addComments === 'Yes'
    );

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
        fileUri,
        new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE),
        converted
    );

    await vscode.workspace.applyEdit(edit);

    vscode.window.showInformationMessage('CodeMorph conversion applied ✅');
}

async function convertWithAI(
    code: string,
    from: string,
    to: string,
    withComments: boolean
): Promise<string> {

    const apiKey = vscode.workspace
        .getConfiguration('codemorph')
        .get<string>('geminiApiKey');

    if (!apiKey) {
        throw new Error('Gemini API key not set (Settings → CodeMorph)');
    }

    const prompt = `
Convert the following ${from} code to ${to}.
${withComments ? 'Add clear explanatory comments.' : 'Do not add comments.'}
Return ONLY valid ${to} code. No markdown. No explanation.

CODE:
${code}
`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    );

    const data: any = await response.json();

    const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('AI returned empty response');
    }

    return stripMarkdown(text);
}

function stripMarkdown(code: string): string {
    return code
        .replace(/```[\s\S]*?\n?/g, '')
        .replace(/```/g, '')
        .trim();
}

export function deactivate() {}
