/** علامة القائمة في المصدر. العرض يتركها للقائمة نفسها حتى لا تتكرر. */
export function visibleItem(text: string): string {
  const visible = text.replace(/^•\s*/, '');
  return visible || text;
}

/** سطر ☐ هو مربع الواجهة. الجملة تبقى كما هي. */
export function visibleCheck(text: string): string {
  const visible = text.replace(/^•\s*☐\s*/, '');
  return visible || text;
}
