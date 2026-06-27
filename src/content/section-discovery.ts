import type { ShowcaseStop } from '../types/showcase';
import {
  dedupeElements,
  generateStableSelector,
  getElementLabel,
  isElementVisible,
} from './selector-utils';

const MAX_STOPS = 20;
const MIN_CHILD_HEIGHT = 200;

function queryAll(selector: string): Element[] {
  return Array.from(document.querySelectorAll(selector));
}

function collectFromHeuristics(): Element[] {
  const candidates: Element[] = [];

  const pipelines: string[] = [
    'main section[id]',
    'main > section',
    'section[id]',
  ];

  for (const selector of pipelines) {
    candidates.push(...queryAll(selector));
  }

  const main = document.querySelector('main');
  if (main) {
    for (const child of Array.from(main.children)) {
      if (
        child instanceof HTMLElement &&
        child.offsetHeight > MIN_CHILD_HEIGHT
      ) {
        candidates.push(child);
      }
    }
  }

  return candidates;
}

function ensureFooterLast(elements: Element[]): Element[] {
  const footer = document.querySelector('footer');
  if (!footer || !isElementVisible(footer)) {
    return elements;
  }

  const withoutFooter = elements.filter((el) => el !== footer);
  if (elements.includes(footer)) {
    return [...withoutFooter, footer];
  }

  return [...withoutFooter, footer];
}

function toStop(el: Element): ShowcaseStop {
  return {
    selector: generateStableSelector(el),
    label: getElementLabel(el),
  };
}

export function autoDetectSections(): {
  stops: ShowcaseStop[];
  truncated: boolean;
} {
  const visible = dedupeElements(collectFromHeuristics()).filter(
    isElementVisible,
  );
  const ordered = ensureFooterLast(visible);
  const truncated = ordered.length > MAX_STOPS;
  const limited = ordered.slice(0, MAX_STOPS);

  return {
    stops: limited.map(toStop),
    truncated,
  };
}
