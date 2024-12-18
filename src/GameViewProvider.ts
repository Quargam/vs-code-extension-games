import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class GameViewProvider implements vscode.WebviewViewProvider {
  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    // Задаем HTML-контент для отображения панели
    webviewView.webview.html = this.getWebviewContent();

    // Обработка сообщений из Webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'openGame':
          this.openGameView(); // Открываем игру в новой вкладке
          break;
      }
    });
  }

  getWebviewContent(): string {
    return `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Game Panel</h1>
        <button id="openGame">Play 2048</button>
        <script>
          const vscode = acquireVsCodeApi();
          document.getElementById('openGame').addEventListener('click', () => {
            vscode.postMessage({ command: 'openGame' });
          });
        </script>
      </body>
      </html>
    `;
  }

  openGameView() {
    const panel = vscode.window.createWebviewPanel(
      '2048Game', // Идентификатор панели
      '2048 Game', // Заголовок вкладки
      vscode.ViewColumn.One, // Колонка редактора
      {
        enableScripts: true, // Разрешить скрипты
        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'games', '2048'))], // Ограничиваем доступ к играм
      }
    );

    panel.webview.html = this.getGameHtml(panel.webview);
  }

  getGameHtml(webview: vscode.Webview): string {
    const filePath = path.join(this.context.extensionPath, 'games', '2048', 'index.html');
    const baseUri = webview.asWebviewUri(vscode.Uri.file(path.dirname(filePath)));

    // Читаем и корректируем пути для ресурсов (CSS, JS)
    let htmlContent = fs.readFileSync(filePath, 'utf-8');

    // Заменяем пути для CSS и JS с использованием baseUri
    htmlContent = htmlContent.replace(/href="(style\/[^\"]+)"/g, (match, p1) => {
      return `href="${webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'games', '2048', p1)))}"`;
    });

    htmlContent = htmlContent.replace(/src="(js\/[^\"]+)"/g, (match, p1) => {
      return `src="${webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'games', '2048', p1)))}"`;
    });

    return htmlContent;
  }
}
