import * as vscode from 'vscode';

export class QMLCodeActionProvider implements vscode.CodeActionProvider {
    
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        
        const actions: vscode.CodeAction[] = [];
        
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source === 'QML Performance' && diagnostic.message.includes('asynchronous')) {
                const action = new vscode.CodeAction('Add asynchronous loading', vscode.CodeActionKind.QuickFix);
                action.edit = new vscode.WorkspaceEdit();
                action.edit.replace(document.uri, diagnostic.range, 'Qt.createComponent("", Component.Asynchronous)');
                actions.push(action);
            }
            
            if (diagnostic.source === 'QML Type Error' && diagnostic.message.includes('Boolean values')) {
                const action = new vscode.CodeAction('Remove quotes from boolean', vscode.CodeActionKind.QuickFix);
                action.edit = new vscode.WorkspaceEdit();
                const text = document.getText(diagnostic.range);
                const fixed = text.replace(/["'](true|false)["']/, '$1');
                action.edit.replace(document.uri, diagnostic.range, fixed);
                actions.push(action);
            }
            
            if (diagnostic.source === 'QML Accessibility') {
                const action = new vscode.CodeAction('Add accessibility properties', vscode.CodeActionKind.QuickFix);
                action.edit = new vscode.WorkspaceEdit();
                const line = document.lineAt(diagnostic.range.start.line);
                const indent = line.text.match(/^\s*/)?.[0] || '';
                const newText = `${indent}Accessible.name: ""\n${indent}Accessible.description: ""\n`;
                action.edit.insert(document.uri, line.range.end, '\n' + newText);
                actions.push(action);
            }
        }
        
        return actions;
    }
}
