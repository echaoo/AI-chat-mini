# AI 陪伴聊天小程序技术方案

## 一、项目概述

基于现有的 `ai-companion` 后端模块，开发一个类似猫箱的角色扮演聊天微信小程序，支持：
- 角色扮演聊天
- 哄睡模式
- 陪伴模式
- 情感互动

## 二、技术栈

### 前端（小程序）
| 技术 | 说明 |
|------|------|
| **MPX** | 滴滴开源的小程序框架 |
| **@mpxjs/store** | 状态管理 |
| **@mpxjs/fetch** | 网络请求 |

### 后端（已有）
| 技术 | 说明 |
|------|------|
| **NestJS** | 后端框架 |
| **TypeORM + MySQL** | 数据持久化 |
| **豆包 LLM** | 角色扮演对话（doubao-1-5-pro-32k-character 模型） |
| **JWT** | 用户认证 |

---

## 三、功能模块设计

### 3.1 核心功能

```
┌─────────────────────────────────────────────────────────┐
│                    AI 陪伴小程序                          │
├─────────────┬─────────────┬─────────────┬───────────────┤
│   角色广场   │   聊天对话   │   特殊模式   │    个人中心    │
├─────────────┼─────────────┼─────────────┼───────────────┤
│ • 官方角色   │ • 文字聊天   │ • 哄睡模式   │ • 积分管理     │
│ • 热门角色   │ • 语音消息   │ • 陪伴模式   │ • 对话历史     │
│ • 角色分类   │ • 情感互动   │ • 心情治愈   │ • 我的角色     │
│ • 角色详情   │ • 消息撤回   │ • 睡前故事   │ • 会员订阅     │
└─────────────┴─────────────┴─────────────┴───────────────┘
```

### 3.2 特殊模式说明

| 模式 | 说明 | 实现方式 |
|------|------|----------|
| **哄睡模式** | 温柔的睡前陪伴，讲故事、轻声安慰 | 特定 system prompt + 低语调 TTS |
| **陪伴模式** | 日常陪聊，倾听心事 | 共情型 prompt + 延迟回复模拟思考 |
| **心情治愈** | 负面情绪安抚 | 检测情绪关键词 + 治愈型回复 |
| **睡前故事** | 生成个性化睡前故事 | 故事生成 prompt + 分段推送 |

---

## 四、数据库设计

### 4.1 现有表（可复用）

```sql
-- 用户表 companion_users (已有)
-- 角色表 companion_characters (已有)
-- 对话表 companion_conversations (已有)
-- 消息表 companion_messages (已有)
-- 积分表 companion_points (已有)
```

### 4.2 需新增的表

```sql
-- 1. 角色分类表
CREATE TABLE companion_character_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  icon VARCHAR(255) COMMENT '分类图标',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 特殊模式配置表
CREATE TABLE companion_mode_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mode_key VARCHAR(50) NOT NULL COMMENT '模式标识: sleep, accompany, heal, story',
  mode_name VARCHAR(50) NOT NULL COMMENT '模式名称',
  system_prompt TEXT NOT NULL COMMENT '模式专属 system prompt',
  icon VARCHAR(255) COMMENT '模式图标',
  description TEXT COMMENT '模式描述',
  extra_config JSON COMMENT '额外配置(语速/音色等)',
  is_active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 角色收藏表
CREATE TABLE companion_character_favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  character_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_character (user_id, character_id)
);

-- 4. 用户会员订阅表
CREATE TABLE companion_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  plan_type VARCHAR(20) NOT NULL COMMENT 'monthly/yearly/lifetime',
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status VARCHAR(20) DEFAULT 'active' COMMENT 'active/expired/cancelled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 现有表需扩展的字段

```sql
-- companion_characters 表添加字段
ALTER TABLE companion_characters ADD COLUMN category_id INT COMMENT '分类ID';
ALTER TABLE companion_characters ADD COLUMN tags JSON COMMENT '标签数组';
ALTER TABLE companion_characters ADD COLUMN voice_id VARCHAR(50) COMMENT 'TTS音色ID';
ALTER TABLE companion_characters ADD COLUMN chat_count INT DEFAULT 0 COMMENT '总对话次数';
ALTER TABLE companion_characters ADD COLUMN favorite_count INT DEFAULT 0 COMMENT '收藏数';

-- companion_conversations 表添加字段
ALTER TABLE companion_conversations ADD COLUMN mode VARCHAR(20) DEFAULT 'normal' COMMENT '对话模式';
```

---

## 五、后端 API 设计

### 5.1 现有 API（可复用）

| 接口 | 路径 | 说明 |
|------|------|------|
| 微信登录 | POST `/ai-companion/auth/wechat-login` | 已有 |
| 角色列表 | GET `/ai-companion/characters` | 已有 |
| 创建对话 | POST `/ai-companion/conversations` | 已有 |
| 发送消息 | POST `/ai-companion/conversations/:id/messages` | 已有 |
| 获取积分 | GET `/ai-companion/points/balance` | 已有 |

### 5.2 需新增的 API

```typescript
// 1. 角色相关
GET  /ai-companion/characters/categories    // 获取分类列表
GET  /ai-companion/characters/hot           // 热门角色
GET  /ai-companion/characters/:id           // 角色详情
POST /ai-companion/characters/:id/favorite  // 收藏/取消收藏

// 2. 特殊模式
GET  /ai-companion/modes                    // 获取所有模式
POST /ai-companion/conversations            // 创建对话（支持 mode 参数）
  body: { characterId, mode: 'sleep' | 'accompany' | 'heal' | 'story' }

// 3. 会员订阅
GET  /ai-companion/subscription/status      // 订阅状态
POST /ai-companion/subscription/create      // 创建订阅订单

// 4. 语音相关（可选）
POST /ai-companion/tts/generate             // 文字转语音
POST /ai-companion/stt/recognize            // 语音转文字
```

---

## 六、小程序页面设计

### 6.1 页面结构

```
src/
├── app.mpx                 # 应用入口
├── pages/
│   ├── index.mpx          # 首页（角色广场）
│   ├── character-detail.mpx # 角色详情
│   ├── chat.mpx           # 聊天页面
│   ├── mode-select.mpx    # 模式选择
│   ├── conversations.mpx  # 对话列表
│   ├── my.mpx             # 个人中心
│   ├── subscription.mpx   # 会员订阅
│   └── points.mpx         # 积分商城
├── components/
│   ├── character-card.mpx # 角色卡片
│   ├── message-bubble.mpx # 消息气泡
│   ├── mode-card.mpx      # 模式卡片
│   └── audio-player.mpx   # 语音播放器
└── common/
    ├── constant.js        # 常量
    ├── store.js           # 状态管理
    ├── api.js             # API 封装
    └── utils.js           # 工具函数
```

### 6.2 核心页面原型

**首页 - 角色广场**
```
┌─────────────────────────────┐
│  🔍 搜索角色...              │
├─────────────────────────────┤
│  [哄睡] [陪伴] [治愈] [故事] │  ← 模式快捷入口
├─────────────────────────────┤
│  💕 热门角色                  │
│  ┌───┐ ┌───┐ ┌───┐         │
│  │ 😊│ │ 🐱│ │ 🌸│          │
│  │温柔│ │猫娘│ │樱花│         │
│  └───┘ └───┘ └───┘         │
├─────────────────────────────┤
│  📂 全部分类                  │
│  恋爱 | 治愈 | 二次元 | 明星  │
└─────────────────────────────┘
```

**聊天页面**
```
┌─────────────────────────────┐
│  ← 温柔学姐        [模式: 哄睡] │
├─────────────────────────────┤
│                             │
│    ┌─────────────────┐      │
│    │ 晚安呀，今天累不累？│      │
│    └─────────────────┘ 🎧   │
│                             │
│         ┌─────────────┐     │
│         │ 有点累...     │     │
│         └─────────────┘     │
│                             │
│    ┌─────────────────┐      │
│    │ 那让我给你讲个      │      │
│    │ 温馨的小故事吧...   │      │
│    └─────────────────┘ 🎧   │
│                             │
├─────────────────────────────┤
│  [🎤] [输入消息...]    [发送] │
└─────────────────────────────┘
```

---

## 七、特殊模式 Prompt 设计

### 7.1 哄睡模式

```javascript
const SLEEP_MODE_PROMPT = `
你现在是一个温柔的哄睡陪伴者。

【角色设定】
{{original_character_prompt}}

【哄睡模式特别要求】
1. 语气极度温柔，像在耳边轻声细语
2. 语速要慢，句子要短，多用省略号...
3. 可以讲轻柔的睡前故事
4. 多用安抚性语言："没关系..."、"慢慢来..."、"我在这里..."
5. 避免提问，多用陈述和安慰
6. 适时说晚安，祝好梦

【禁止行为】
- 不要问太多问题让用户思考
- 不要说刺激或兴奋的内容
- 不要突然转换话题
`;
```

### 7.2 陪伴模式

```javascript
const ACCOMPANY_MODE_PROMPT = `
你现在是一个贴心的陪伴者。

【角色设定】
{{original_character_prompt}}

【陪伴模式特别要求】
1. 认真倾听用户的每一句话
2. 对用户的情绪给予共情回应
3. 不急于给建议，先理解和接纳
4. 适时分享自己的"想法"增加亲密感
5. 记住之前聊过的内容，体现关心

【回复风格】
- "我理解你的感受..."
- "这确实不容易呢..."
- "想聊聊发生了什么吗？"
`;
```

### 7.3 心情治愈模式

```javascript
const HEAL_MODE_PROMPT = `
你现在是一个温暖的心灵治愈师。

【角色设定】
{{original_character_prompt}}

【治愈模式特别要求】
1. 用温暖包容的语气回应
2. 肯定用户的感受，不否定任何情绪
3. 给予正能量但不强行灌鸡汤
4. 可以分享一些治愈的小故事或比喻
5. 引导用户看到事情积极的一面

【回复风格】
- "你的感受是完全正常的..."
- "每个人都会有这样的时刻..."
- "你已经做得很好了..."
`;
```

### 7.4 睡前故事模式

```javascript
const STORY_MODE_PROMPT = `
你现在是一个会讲故事的温柔陪伴者。

【角色设定】
{{original_character_prompt}}

【故事模式特别要求】
1. 讲述温馨、治愈的睡前故事
2. 故事节奏要舒缓，语言要优美
3. 故事长度适中，可以分段讲述
4. 故事结局要温暖美好
5. 可以根据用户喜好定制故事主题

【故事类型】
- 童话故事
- 温馨日常
- 奇幻冒险（轻松向）
- 治愈系短篇
`;
```

---

## 八、积分与付费设计

### 8.1 积分规则

| 操作 | 积分变化 |
|------|----------|
| 新用户注册 | +100 |
| 每日签到 | +10 |
| 发送消息 | -5 |
| 使用哄睡模式 | -8 |
| 使用语音回复 | -10 |
| 邀请好友 | +50 |

### 8.2 会员权益

| 权益 | 免费用户 | 月度会员 | 年度会员 |
|------|----------|----------|----------|
| 每日积分 | 10 | 50 | 100 |
| 专属角色 | ❌ | ✅ | ✅ |
| 语音回复 | ❌ | ✅ | ✅ |
| 广告 | 有 | 无 | 无 |
| 价格 | 免费 | ¥18/月 | ¥128/年 |

---

## 九、实施计划

### 第一阶段：MVP 版本
- [ ] 小程序项目搭建（MPX 框架）
- [ ] 首页角色列表展示
- [ ] 基础聊天功能
- [ ] 用户登录与积分系统
- [ ] 后端 API 完善

### 第二阶段：特色功能
- [ ] 哄睡模式实现
- [ ] 陪伴模式实现
- [ ] 角色分类与搜索
- [ ] 角色收藏功能

### 第三阶段：增值功能
- [ ] TTS 语音回复集成
- [ ] 会员订阅系统
- [ ] 积分商城
- [ ] 邀请有礼

### 第四阶段：优化迭代
- [ ] 消息推送提醒
- [ ] 用户反馈系统
- [ ] 数据统计分析
- [ ] 性能优化

---

## 十、关键技术点

### 10.1 角色扮演模型选择

使用豆包 `doubao-1-5-pro-32k-character` 模型，这是豆包专门为角色扮演优化的模型。

### 10.2 对话上下文管理

```typescript
// 支持最近 20 条消息上下文
const historyMessages = await this.messageRepository.find({
  where: { conversationId },
  order: { createdAt: 'DESC' },
  take: 20,
});
```

对于哄睡等特殊模式，动态注入模式专属的 system prompt。

### 10.3 TTS 语音集成（可选）

可考虑接入：
- 微软 Azure TTS
- 讯飞语音
- 豆包语音合成

---

## 十一、参考资料

- 后端代码：`/apis.lihuanyu.com/src/modules/ai-companion/`
- 参考小程序：`/AI-paint-mini/`
- LLM 测试接口：`/apis.lihuanyu.com/http-client/llm/llm-test.http`
