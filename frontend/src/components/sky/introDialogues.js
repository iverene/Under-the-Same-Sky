import DIALOGUES from './introDialogues.json';

export const FALLBACK_PAIR = {
  boy: "Our stories may be different, but we're under the same sky.",
  girl: "And sometimes, knowing we're not alone is enough to keep going.",
};

export const POOL = Array.isArray(DIALOGUES) && DIALOGUES.length > 0 ? DIALOGUES : [FALLBACK_PAIR];

export const randomDialogueIndex = (exclude = -1) => {
  if (POOL.length <= 1) return 0;
  let i = Math.floor(Math.random() * POOL.length);
  if (i === exclude) i = (i + 1) % POOL.length;
  return i;
};
