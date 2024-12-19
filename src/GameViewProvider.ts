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
          this.openGameView(message.game); // Открываем игру в новой вкладке
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
        <button id="open2048">Play 2048</button>
        <button id="openClumsyBird">Play Clumsy Bird</button>
        <script>
          const vscode = acquireVsCodeApi();
          
          document.getElementById('open2048').addEventListener('click', () => {
            vscode.postMessage({ command: 'openGame', game: '2048' });
          });
          
          document.getElementById('openClumsyBird').addEventListener('click', () => {
            vscode.postMessage({ command: 'openGame', game: 'clumsyBird' });
          });
        </script>
      </body>
      </html>
    `;
  }

  openGameView(game: string) {
    let gameFolder = '';
  
    switch (game) {
      case '2048':
        gameFolder = '2048';
        break;
      case 'clumsyBird':
        gameFolder = 'clumsy-bird';
        break;
      default:
        return;
    }
  
    const panel = vscode.window.createWebviewPanel(
      `${game}Game`, // Идентификатор панели
      `${game} Game`, // Заголовок вкладки
      vscode.ViewColumn.One, // Колонка редактора
      {
        enableScripts: true, // Разрешить скрипты
        localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'games', gameFolder))], // Ограничиваем доступ к играм
      }
    );
  
    panel.webview.html = this.getGameHtml(panel.webview, gameFolder);
  }  

  getGameHtml(webview: vscode.Webview, gameFolder: string): string {
    const gamePath = path.join(this.context.extensionPath, 'games', gameFolder);
    const filePath = path.join(gamePath, 'index.html');
  
    // Читаем содержимое index.html
    let htmlContent = fs.readFileSync(filePath, 'utf-8');
  
    // Функция для преобразования пути
    const replacePaths = (content: string, basePath: string) => {
      // CSS файлы
      content = content.replace(/href="([^"]+\.css)"/g, (_, p1) => {
        const newPath = webview.asWebviewUri(vscode.Uri.file(path.join(basePath, p1)));
        return `href="${newPath}"`;
      });
  
      // JS файлы
      content = content.replace(/src="([^"]+\.js)"/g, (_, p1) => {
        const scriptPath = path.join(basePath, p1);
        const newPath = webview.asWebviewUri(vscode.Uri.file(scriptPath));
  
        // Рекурсивно обрабатываем JS файл
        this.processScript(scriptPath, webview, gamePath);
  
        return `src="${newPath}"`;
      });
  
      // Изображения
      content = content.replace(/src="([^"]+\.(jpg|jpeg|png|gif|ico))"/g, (_, p1) => {
        const newPath = webview.asWebviewUri(vscode.Uri.file(path.join(basePath, p1)));
        return `src="${newPath}"`;
      });
  
      // Шрифты
      content = content.replace(/href="([^"]+\.(woff|woff2|ttf|eot|svg))"/g, (_, p1) => {
        const newPath = webview.asWebviewUri(vscode.Uri.file(path.join(basePath, p1)));
        return `href="${newPath}"`;
      });
  
      return content;
    };
  
    // Обрабатываем HTML файл
    htmlContent = replacePaths(htmlContent, gamePath);
  
    return htmlContent;
  }
  processScript(filePath: string, webview: vscode.Webview, gamePath: string): void {
    if (!fs.existsSync(filePath)) {
      console.warn(`Файл не найден: ${filePath}`);
      return;
    }
  
    const content = fs.readFileSync(filePath, 'utf-8');
  
    // Заменяем пути внутри JS для всех типов ресурсов
    const updatedContent = content.replace(/(["'])(data\/[^"']+)(["'])/g, (match, quote, p1, p2) => {
      // Создаем новый путь для файла
      const newPath = webview.asWebviewUri(vscode.Uri.file(path.join(gamePath, p1)));
      return `${quote}${newPath}${quote}`;
    });
  
    // Перезаписываем файл с обновленным содержимым
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
  }
  
}
