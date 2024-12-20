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
    webviewView.webview.html = fs.readFileSync(path.join(this.context.extensionPath, 'src', 'webviewViewGame.html'), 'utf-8');

    // Обработка сообщений из Webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case 'openGame':
          this.openGameView(message.game); // Открываем игру в новой вкладке
          break;
      }
    });
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
      case 'hextris':
        gameFolder = 'hextris';
        break;
        case 'snake':
          gameFolder = 'snake';
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
    const basePath = path.join(this.context.extensionPath, 'games', gameFolder);
    const filePath = path.join(basePath, 'index.html');
  
    // Функция для преобразования пути
    const replacePaths = (filePath: string, webview: vscode.Webview, basePath: string) => {
      console.log(`обрабатывается файл: ${filePath}`);
      let content = fs.readFileSync(filePath, 'utf-8');
      console.log(`содержимое файл: ${content}`);
      content = content.replace(/(href|src)="([^"]+)"/g, (_, attr, p1) => {
        const originalPath = p1;
        console.log(`найден файл: ${originalPath}`);
        const fullPath = path.join(basePath, originalPath);
        if (fs.existsSync(fullPath)) {
          const newPath = webview.asWebviewUri(vscode.Uri.file(fullPath));
          console.log(`${attr.toUpperCase()} путь изменен: ${originalPath} => ${newPath}`);
          if (!(originalPath.endsWith('.png') || originalPath.endsWith('.svg') || originalPath.endsWith('.ico'))) {
            replacePaths(fullPath, webview, basePath);
          }
          return `${attr}="${newPath}"`; // Учитываем оригинальный атрибут (href или src)
        } else {
          console.warn(`Файл не найден: ${originalPath}`);
          return `${attr}="${originalPath}"`; // Учитываем оригинальный атрибут (href или src)
        }
      });

      content = content.replace(/(href|src)='([^']+)'/g, (_, attr, p1) => {
        const originalPath = p1;
        console.log(`найден файл: ${originalPath}`);
        const fullPath = path.join(basePath, originalPath);
        if (fs.existsSync(fullPath)) {
          const newPath = webview.asWebviewUri(vscode.Uri.file(fullPath));
          console.log(`${attr.toUpperCase()} путь изменен: ${originalPath} => ${newPath}`);
          if (!(originalPath.endsWith('.png') || originalPath.endsWith('.svg') || originalPath.endsWith('.ico'))) {
            replacePaths(fullPath, webview, basePath);
          }
          return `${attr}='${newPath}'`; // Учитываем оригинальный атрибут (href или src)
        } else {
          console.warn(`Файл не найден: ${originalPath}`);
          return `${attr}='${originalPath}'`; // Учитываем оригинальный атрибут (href или src)
        }
      });

      content = content.replace(/src:\s*["']([^"']+)["']/g, (_, p1) => {
        const originalPath = p1;
        console.log(`Найден путь в JS: ${originalPath}`);
        const fullPath = path.join(basePath, originalPath);
        if (fs.existsSync(fullPath)) {
          const newPath = webview.asWebviewUri(vscode.Uri.file(fullPath));
          console.log(`SRC путь изменен: ${originalPath} => ${newPath}`);
          return `src: "${newPath}"`;
        } else {
          console.warn(`Файл не найден: ${fullPath}`);
          return `src: "${originalPath}"`; // Возвращаем оригинальный путь, если файл не найден
        }
      });
    
      content = content.replace(/"src",\s*["']([^"']+)["']/g, (_, p1) => {
        const originalPath = p1;
        console.log(`Найден путь в JS: ${originalPath}`);
        const fullPath = path.join(basePath, originalPath);
        if (fs.existsSync(fullPath)) {
          const newPath = webview.asWebviewUri(vscode.Uri.file(fullPath));
          console.log(`SRC путь изменен: ${originalPath} => ${newPath}`);
          return `"src", "${newPath}"`;
        } else {
          console.warn(`Файл не найден: ${fullPath}`);
          return `"src", "${originalPath}"`; // Возвращаем оригинальный путь, если файл не найден
        }
      });
      fs.writeFileSync(filePath, content, 'utf-8');
      return content;
    };
    return replacePaths(filePath, webview, basePath);
  }
}
