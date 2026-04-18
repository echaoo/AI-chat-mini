# AI 陪伴 H5

当前仓库已切换为 **H5-only** 开发模式，前端基于 `Vue 3 + Vite + TypeScript + Pinia + Vue Router`。

## 启动

```bash
pnpm install
pnpm dev
```

构建：

```bash
pnpm build
```

类型检查：

```bash
pnpm typecheck
```

## 当前实现

- H5 首页
- 角色列表页
- 聊天页
- 对话历史页
- 创建角色页
- 测试 token 直通登录态

## 环境变量

可选：

```bash
VITE_API_BASE_URL=http://localhost:3010
VITE_TEST_TOKEN=echaootest
VITE_REQUEST_TIMEOUT=30000
```

## 目录

```text
src/h5/
├── components/
├── constants/
├── router/
├── services/
├── stores/
├── styles/
├── types/
├── utils/
└── views/
```

## 说明

- 旧小程序代码目前仍保留在仓库中，作为业务逻辑和交互迁移参考。
- 当前 H5 默认使用测试 token，不包含正式登录流程。
- 后续如果接入新的登录方式，只需要替换 `src/h5/stores/auth.ts` 和请求拦截器逻辑。
