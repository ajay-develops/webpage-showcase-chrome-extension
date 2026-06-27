export function isElementVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.offsetHeight === 0) return false;

  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  return true;
}

export function dedupeElements(elements: Element[]): Element[] {
  const seen = new Set<Element>();
  const result: Element[] = [];

  for (const el of elements) {
    if (seen.has(el)) continue;
    seen.add(el);
    result.push(el);
  }

  return result;
}

function escapeCssIdent(value: string): string {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(value);
  }
  return value.replace(/([^\w-])/g, '\\$1');
}

function isUniqueId(id: string): boolean {
  return document.querySelectorAll(`#${escapeCssIdent(id)}`).length === 1;
}

function getNthOfTypeSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  let index = 1;
  let sibling = el.previousElementSibling;

  while (sibling) {
    if (sibling.tagName.toLowerCase() === tag) {
      index++;
    }
    sibling = sibling.previousElementSibling;
  }

  return `${tag}:nth-of-type(${index})`;
}

function buildPathSelector(el: Element): string {
  const segments: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.documentElement) {
    if (current.id && isUniqueId(current.id)) {
      segments.unshift(`#${escapeCssIdent(current.id)}`);
      break;
    }
    segments.unshift(getNthOfTypeSelector(current));
    current = current.parentElement;
  }

  return segments.join(' > ');
}

export function generateStableSelector(el: Element): string {
  if (el.id && isUniqueId(el.id)) {
    return `#${escapeCssIdent(el.id)}`;
  }

  return buildPathSelector(el);
}

export function getElementLabel(el: Element): string {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel?.trim()) return ariaLabel.trim();

  if (el.id) return el.id;

  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading?.textContent?.trim()) {
    return heading.textContent.trim().slice(0, 60);
  }

  return el.tagName.toLowerCase();
}
