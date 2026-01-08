import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

let cache: string | null = null;
export const getScreenshotFontCss = (): string => {
  if (cache) return cache;

  const dir = resolve(process.cwd(), 'node_modules/@fontsource/noto-sans-jp/files');
  const fonts = [400, 500, 600, 700]
    .flatMap((w) => ['japanese', 'latin'].map((s) => ({ weight: w, subset: s })))
    .map(({ weight, subset }) => {
      const file = join(dir, `noto-sans-jp-${subset}-${weight}-normal.woff2`);
      if (!existsSync(file)) return '';
      const base64 = readFileSync(file).toString('base64');
      return `@font-face{font-family:'Noto Sans JP';font-weight:${weight};src:url(data:font/woff2;base64,${base64})format('woff2')}`;
    })
    .filter(Boolean);

  cache = `${fonts.join('\n')}\n*{font-family:'Noto Sans JP',sans-serif!important}`;
  return cache;
};
