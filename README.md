# AI 陪伴聊天小程序

基于 MPX 框架开发的 AI 角色扮演聊天微信小程序。

## 功能特性

- ✅ 角色列表展示
- ✅ 文字对话功能
- ✅ 对话历史管理
- ✅ 支持继续历史对话

## 技术栈

- **MPX** - 滴滴开源的小程序框架
- **TypeScript** - 类型安全
- **Stylus** - CSS 预处理器

## 项目结构

```
src/
├── app.mpx                 # 应用入口
├── pages/
│   ├── index.mpx          # 首页 - 角色列表
│   ├── chat.mpx           # 聊天页面
│   └── conversations.mpx  # 对话历史
├── components/
│   ├── character-card.mpx # 角色卡片组件
│   └── message-bubble.mpx # 消息气泡组件
└── common/
    ├── api.ts             # API 封装
    ├── request.ts         # 网络请求
    ├── config.ts          # 配置文件
    └── types.ts           # TypeScript 类型
```

## 后端 API

项目使用后端 `ai-companion` 模块提供的接口：

| 功能 | 方法 | 路径 |
|------|------|------|
| 官方角色列表 | GET | `/companion/characters/official` |
| 角色详情 | GET | `/companion/characters/:id` |
| 获取对话列表 | GET | `/companion/conversations` |
| 创建对话 | POST | `/companion/conversations` |
| 获取消息历史 | GET | `/companion/conversations/:id/messages` |
| 发送消息 | POST | `/companion/conversations/:id/messages` |
| 删除对话 | DELETE | `/companion/conversations/:id` |

## 开发说明

### 配置

在 `src/common/config.ts` 中配置：

```typescript
// API 基础地址
export const API_BASE_URL = 'http://localhost:3010'

// 测试 Token
export const TEST_TOKEN = 'echaootest'
```

### 运行

```bash
# 安装依赖
npm install

# 开发模式
npm run serve

# 构建
npm run build
```

### 调试

1. 确保后端服务运行在 `http://localhost:3010`
2. 确保数据库中有角色数据（`companion_characters` 表）
3. 使用微信开发者工具打开项目
4. 当前使用测试 token `echaootest`，跳过了授权流程

## 待完善功能

- [ ] 微信登录集成
- [ ] Tab Bar 图标（需要准备图标文件）
- [ ] 默认头像图片
- [ ] 下拉刷新
- [ ] 上拉加载更多
- [ ] 消息发送失败重试
- [ ] 输入框优化（emoji、粘贴等）
- [ ] 角色搜索功能

## 注意事项

1. 目前使用测试 token，生产环境需实现完整的微信登录流程
2. Tab Bar 图标路径需要准备对应的图片文件
3. 对话历史页面加载时需要后端返回角色信息，建议优化后端接口

像深空一样，构建完整立体的人物。