'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '@/lib/ai/types';
// Side-effecting import: carries pre-rebrand localStorage across before hydration.
import './rebrand-migration';

interface ChatState {
  messages: ChatMessage[];
  add: (m: ChatMessage) => void;
  appendToLast: (chunk: string) => void;
  replaceLast: (content: string) => void;
  reset: () => void;
}

/** Persisted conversation so the AI keeps memory across page reloads. */
export const useChat = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      add: (m) => set((s) => ({ messages: [...s.messages, m] })),
      appendToLast: (chunk) =>
        set((s) => {
          const msgs = s.messages.slice();
          const last = msgs[msgs.length - 1];
          if (last) msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
          return { messages: msgs };
        }),
      replaceLast: (content) =>
        set((s) => {
          const msgs = s.messages.slice();
          if (msgs.length) msgs[msgs.length - 1] = { ...msgs[msgs.length - 1]!, content };
          return { messages: msgs };
        }),
      reset: () => set({ messages: [] }),
    }),
    { name: 'vedastra-chat' },
  ),
);
