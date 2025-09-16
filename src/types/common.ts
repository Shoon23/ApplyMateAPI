// src/types/common.ts
export type WithUserId<T> = T & { userId: string };
export type WithIdAndUser<T> = T & { id: string; userId: string };
