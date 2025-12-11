import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const languageNames = {
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'en': 'English',
};

export const difficultyNames = {
  1: '非常简单',
  2: '简单',
  3: '中等',
  4: '困难',
  5: '非常困难',
};
