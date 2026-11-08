/** علامة القائمة في المصدر. العرض يتركها للقائمة نفسها حتى لا تتكرر. */
export function visibleItem(text: string): string {
  const visible = text.replace(/^•\s*/, '');
  return visible || text;
}

/** داخل «تأكد قبل…» السطر محتوى الخطوة، والمربع واحد على العنوان. */
export function visibleListItem(text: string): string {
  return /^•\s*☐/.test(text) ? visibleCheck(text) : visibleItem(text);
}

/** سطر ☐ هو مربع الواجهة. الجملة تبقى كما هي. */
export function visibleCheck(text: string): string {
  const visible = text.replace(/^•\s*☐\s*/, '');
  return visible || text;
}
