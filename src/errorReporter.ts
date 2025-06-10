import * as vscode from 'vscode';
import * as fs from 'fs';

export class ErrorReporter {
    private _diagnosticCollection: vscode.DiagnosticCollection;
    private _outputChannel: vscode.OutputChannel;

    constructor() {
        this._diagnosticCollection = vscode.languages.createDiagnosticCollection('qtLivePreview');
        this._outputChannel = vscode.window.createOutputChannel('QT Live Preview');
    }

    public reportQMLError(filePath: string, error: string) {
        const uri = vscode.Uri.file(filePath);
        const diagnostics: vscode.Diagnostic[] = [];

        // Parse QML error format: "file:line:column: Error: message"
        const errorMatch = error.match(/.*:(\d+):(\d+):\s*(.*?):\s*(.*)/);
        
        if (errorMatch) {
            const line = parseInt(errorMatch[1]) - 1; // VS Code uses 0-based indexing
            const column = parseInt(errorMatch[2]) - 1;
            const severity = errorMatch[3].toLowerCase();
            const message = errorMatch[4];

            const range = new vscode.Range(
                new vscode.Position(Math.max(0, line), Math.max(0, column)),
                new vscode.Position(Math.max(0, line), Math.max(0, column + 10))
            );

            const diagnostic = new vscode.Diagnostic(
                range,
                message,
                severity.includes('error') ? vscode.DiagnosticSeverity.Error : 
                severity.includes('warning') ? vscode.DiagnosticSeverity.Warning : 
                vscode.DiagnosticSeverity.Information
            );

            diagnostic.source = 'QT Live Preview';
            diagnostics.push(diagnostic);
        } else {
            // Generic error if we can't parse the format
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 0),
                error,
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = 'QT Live Preview';
            diagnostics.push(diagnostic);
        }

        this._diagnosticCollection.set(uri, diagnostics);
        this._outputChannel.appendLine(`QML Error in ${filePath}: ${error}`);
        this._outputChannel.show();
    }

    public reportBuildError(error: string) {
        this._outputChannel.appendLine(`Build Error: ${error}`);
        this._outputChannel.show();
        
        vscode.window.showErrorMessage('❌ Qt Build Error', 'Show Output')
            .then(selection => {
                if (selection === 'Show Output') {
                    this._outputChannel.show();
                }
            });
    }

    public clearErrors(filePath?: string) {
        if (filePath) {
            const uri = vscode.Uri.file(filePath);
            this._diagnosticCollection.delete(uri);
        } else {
            this._diagnosticCollection.clear();
        }
    }

    public async validateQMLFile(filePath: string): Promise<boolean> {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const issues: string[] = [];
            
            // Check for common QML issues
            if (!content.includes('import ')) {
                issues.push('Missing import statements');
            }
            
            // Check bracket matching
            const openBraces = (content.match(/\{/g) || []).length;
            const closeBraces = (content.match(/\}/g) || []).length;
            
            if (openBraces !== closeBraces) {
                issues.push('Mismatched braces');
            }
            
            // Check for unclosed strings
            const quotes = (content.match(/"/g) || []).length;
            if (quotes % 2 !== 0) {
                issues.push('Unclosed string literal');
            }

            if (issues.length > 0) {
                this.reportQMLError(filePath, issues.join(', '));
                return false;
            }

            this.clearErrors(filePath);
            return true;
            
        } catch (error) {
            this.reportQMLError(filePath, `File validation error: ${error}`);
            return false;
        }
    }

    public dispose() {
        this._diagnosticCollection.dispose();
        this._outputChannel.dispose();
    }
}
