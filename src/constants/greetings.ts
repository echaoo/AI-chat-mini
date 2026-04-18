type TimeCategory = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' | 'default'
type GreetingSet = Partial<Record<TimeCategory, string[]>>

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

function getTimeCategory(): TimeCategory {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 14) return 'noon'
  if (hour >= 14 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 23) return 'evening'
  return 'night'
}

function randomPick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getGreeting() {
  const category = getTimeCategory()

  if (commonGreetings[category]?.length) {
    return randomPick(commonGreetings[category]!)
  }

  return randomPick(commonGreetings.default || ['你好'])
}
