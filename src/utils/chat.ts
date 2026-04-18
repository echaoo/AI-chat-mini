export interface MessageSegment {
  key: string
  text: string
  isAside: boolean
}

export function normalizeDisplayedContent(content: string) {
  if (!content) return ''

  return content
    .replace(/\*(\s*[（(][^）)]*[）)]\s*)\*/g, '$1')
    .replace(/([（(][^）)]*[）)])/g, (match) => match.replace(/\*/g, ''))
}

export function parseContentSegments(content: string): MessageSegment[] {
  if (!content) return []

  const normalized = normalizeDisplayedContent(content)
  const pattern = /（[^）]*）|\([^)]*\)/g
  const segments: MessageSegment[] = []
  let lastIndex = 0
  let segmentIndex = 0

  for (let match = pattern.exec(normalized); match; match = pattern.exec(normalized)) {
    if (match.index > lastIndex) {
      segments.push({
        key: `text-${segmentIndex}`,
        text: normalized.slice(lastIndex, match.index),
        isAside: false
      })
      segmentIndex += 1
    }

    segments.push({
      key: `aside-${segmentIndex}`,
      text: match[0],
      isAside: true
    })
    segmentIndex += 1
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < normalized.length) {
    segments.push({
      key: `text-${segmentIndex}`,
      text: normalized.slice(lastIndex),
      isAside: false
    })
  }

  return segments
}
