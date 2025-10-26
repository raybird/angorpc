# 系統需求與環境準備

## 系統需求

### 最低需求
- **作業系統**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **記憶體**: 8GB RAM
- **硬碟空間**: 10GB 可用空間
- **網路**: 穩定的網際網路連線

### 建議需求
- **記憶體**: 16GB RAM 或更多
- **硬碟空間**: 20GB 可用空間 (包含開發工具和依賴)
- **處理器**: 多核心 CPU (4核心以上)

## 必要軟體

### 1. Node.js
- **版本**: 18.x 或 20.x (LTS 版本)
- **下載**: [nodejs.org](https://nodejs.org/)
- **驗證**: `node --version` 和 `npm --version`

```bash
# 建議使用 nvm 管理 Node.js 版本
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. Angular CLI
- **版本**: 20.x (最新版本)
- **安裝**: `npm install -g @angular/cli@20`

```bash
npm install -g @angular/cli@20
ng version
```

### 3. Git
- **版本**: 2.30+ 
- **下載**: [git-scm.com](https://git-scm.com/)
- **驗證**: `git --version`

### 4. 程式碼編輯器
推薦使用以下任一編輯器：
- **Visual Studio Code** (推薦)
  - 擴充功能：Angular Language Service, TypeScript Importer
- **WebStorm**
- **Vim/Neovim** (with LSP)

## 開發工具

### 1. 資料庫 (選擇其一)
- **PostgreSQL** 15+ (推薦)
- **MySQL** 8.0+
- **SQLite** (開發用)

### 2. API 測試工具
- **Postman** 或 **Insomnia**
- **curl** (命令列工具)

### 3. 版本控制
- **Git** (已包含在必要軟體中)
- **GitHub/GitLab** 帳號 (可選)

## 環境變數設定

### 1. 建立環境變數檔案
```bash
# 專案根目錄
touch .env
touch .env.local
touch .env.example
```

### 2. 基本環境變數
```env
# .env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/angorpc
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:4200
```

## 系統檢查清單

在開始開發前，請確認以下項目：

- [ ] Node.js 已安裝並可正常使用
- [ ] Angular CLI 已安裝
- [ ] Git 已安裝並配置
- [ ] 程式碼編輯器已安裝並配置
- [ ] 資料庫已安裝並運行
- [ ] 網路連線正常
- [ ] 防火牆設定允許必要端口

## 常見問題排除

### Node.js 版本問題
```bash
# 如果遇到版本不相容問題
nvm install 20
nvm use 20
npm cache clean --force
```

### 權限問題 (Linux/macOS)
```bash
# 避免使用 sudo 安裝全域套件
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Windows 權限問題
- 以管理員身份執行命令提示字元
- 或使用 PowerShell 執行 `Set-ExecutionPolicy RemoteSigned`

## 下一步

環境準備完成後，請繼續閱讀：
- [安裝步驟](./installation.md) - 詳細的專案安裝指南
- [配置說明](./configuration.md) - 專案配置設定

---

最後更新：2025年10月26日
