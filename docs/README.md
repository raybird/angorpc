# AngoRPC 專案文件

## 專案概述

AngoRPC 是一個基於 Angular + SSR + ORPC 的全端專案，提供類型安全、高效能的前後端通信解決方案。

## 文件結構

```
docs/
├── README.md                 # 文件首頁
├── architecture/             # 技術架構文件
│   ├── overview.md          # 整體架構概述
│   ├── angular20-features.md # Angular 20 新特性
│   ├── angular-ssr-explanation.md # Angular SSR 與 Universal 說明
│   ├── orpc-adapters-analysis.md # oRPC Adapters 分析
│   ├── ssr-orpc-integration.md # SSR 與 ORPC 整合架構
│   ├── frontend.md          # 前端架構
│   ├── backend.md           # 後端架構
│   └── orpc-integration.md  # ORPC 整合設計
├── setup/                   # 環境設定指南
│   ├── prerequisites.md     # 系統需求
│   ├── installation.md      # 安裝步驟
│   └── configuration.md     # 配置說明
├── api/                     # API 設計文件
│   ├── design.md           # API 設計原則
│   ├── endpoints.md        # 端點定義
│   └── types.md            # 類型定義
├── development/             # 開發指南
│   ├── getting-started.md  # 快速開始
│   ├── coding-standards.md # 編碼規範
│   └── testing.md          # 測試指南
└── deployment/              # 部署文件
    ├── production.md       # 生產環境部署
    └── monitoring.md       # 監控與維護
```

## 快速導航

- [專案概述](./overview.md) - 了解專案目標和技術選型
- [技術架構](./architecture/overview.md) - 深入了解系統架構
- [Angular 20 特性](./architecture/angular20-features.md) - Angular 20 新功能說明
- [Angular SSR 說明](./architecture/angular-ssr-explanation.md) - SSR 與 Universal 的關係
- [oRPC Adapters 分析](./architecture/orpc-adapters-analysis.md) - oRPC 適配器詳細分析
- [SSR 與 ORPC 整合](./architecture/ssr-orpc-integration.md) - 統一伺服器架構設計
- [環境設定](./setup/prerequisites.md) - 開始設定開發環境
- [API 設計](./api/design.md) - 了解 API 設計原則

## 技術棧

- **前端**: Angular 20 with SSR (@angular/ssr)
- **後端**: Node.js with ORPC
- **類型安全**: TypeScript (全端共享)
- **資料庫**: 待定
- **部署**: 待定

## 開發狀態

- [x] 專案文件建立
- [ ] 環境設定
- [ ] 基礎架構實作
- [ ] API 開發
- [ ] 前端開發
- [ ] 測試
- [ ] 部署

---

最後更新：2025年10月26日
