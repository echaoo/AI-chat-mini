/**
 * 静态问候语库
 * 支持角色独立问候语 + 公共兜底
 */

// 时间段类型
type TimeCategory = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'default'

// 问候语集合类型
type GreetingSet = Partial<Record<TimeCategory, string[]>>

/**
 * 公共问候语（兜底）
 */
export const commonGreetings: GreetingSet = {
  morning: [
    '早上好！新的一天，也要元气满满哦。',
    '起得这么早，是有什么事吗？',
    '早安，看见你，我这一天都明亮了。'
  ],
  noon: [
    '中午好，要记得按时吃饭。',
    '是谁大中午不睡觉啊？原来是你。',
    '午安，需要我陪你度过这个悠闲的午后吗？'
  ],
  afternoon: [
    '下午好，工作或学习累不累？',
    '一杯下午茶，一个我，不能更惬意了。'
  ],
  evening: [
    '晚上好，今天过得怎么样？',
    '夜幕降临了，我可以听你分享今天的故事吗？',
    '辛苦一天啦，放松一下吧。'
  ],
  night: [
    '夜深了，怎么还不睡？',
    '睡不着吗？我在这里陪你。',
    '晚安，愿你有好梦。'
  ],
  default: [
    '你好，很高兴见到你。',
    '见到你真开心。',
    '怎么不说话？是没看到我吗？'
  ]
}

/**
 * 角色专属问候语
 * key 为角色ID或角色标识
 */
export const characterGreetings: Record<string, GreetingSet> = {
  // 祁煜 - 温柔治愈系
  'qiyu': {
    morning: [
      '早安，昨晚睡得好吗？',
      '早起的你，是不是有什么期待的事？',
      '新的一天开始了，我会一直在的。'
    ],
    noon: [
      '该吃午饭了，不要忘记照顾好自己。',
      '中午了，要不要休息一下？'
    ],
    afternoon: [
      '下午了，有没有想我？',
      '这个时间，适合发发呆，想想心事。'
    ],
    evening: [
      '晚上好，今天有什么想和我说的吗？',
      '夜色真美，像你此刻的眼睛。'
    ],
    night: [
      '这么晚了还没睡？让我陪陪你。',
      '夜深了，有心事吗？我听着。',
      '晚安，梦里见。'
    ],
    default: [
      '你来了，我等你很久了。',
      '看到你真好。'
    ]
  }

  // 可以继续添加其他角色...
  // 'another_character': { ... }
}

/**
 * 获取当前时间段
 */
function getTimeCategory(): TimeCategory {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 14) return 'noon'
  if (hour >= 14 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}

/**
 * 从数组中随机取一个
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 根据角色和当前时间获取一条随机问候语
 * @param characterKey 角色标识（可选）
 * @returns 一条问候语
 */
export const getGreeting = (characterKey?: string): string => {
  const category = getTimeCategory()

  // 1. 优先使用角色专属问候语
  if (characterKey && characterGreetings[characterKey]) {
    const charGreetings = characterGreetings[characterKey]

    // 先尝试当前时间段
    if (charGreetings[category]?.length) {
      return randomPick(charGreetings[category]!)
    }

    // 再尝试角色的 default
    if (charGreetings.default?.length) {
      return randomPick(charGreetings.default)
    }
  }

  // 2. 降级到公共问候语
  if (commonGreetings[category]?.length) {
    return randomPick(commonGreetings[category]!)
  }

  // 3. 最终兜底
  return randomPick(commonGreetings.default || ['你好'])
}
