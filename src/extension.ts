import * as vscode from 'vscode';
import { GameViewProvider } from './GameViewProvider';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'gameView',
            new GameViewProvider(context)
        )
    );
}

export function deactivate() {}
