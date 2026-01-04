/**
 * 问候语生成工具
 */

// 默认问候语
const defaultGreetings = [
  '你好呀，今天过得怎么样？',
  '终于等到你了~',
  '想我了吗？',
  '见到你真开心！',
  '有什么想聊的吗？'
]

// 祁煜角色专属问候语
const qiyuGreetings = [
  '你来了...我等你很久了。',
  '今天的月色真美，正适合想你。',
  '不管发生什么，我都会在这里等你。',
  '你的笑容，是我最珍贵的礼物。',
  '能和你说话，真好。'
]

/**
 * 获取问候语
 * @param characterKey 角色标识
 * @returns 随机问候语
 */
export function getGreeting(characterKey?: string): string {
  const greetings = characterKey === 'qiyu' ? qiyuGreetings : defaultGreetings
  const index = Math.floor(Math.random() * greetings.length)
  const greeting = greetings[index]
  if (greeting === undefined) {
    return '你好'
  }
  return greeting
}
