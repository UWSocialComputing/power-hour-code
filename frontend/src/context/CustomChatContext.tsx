import { createContext } from 'react';

export const CustomChatContext = createContext({
  "toggleChatHandler": (s: string) => {console.log(s)},
  "updateSessionHandler": (s: number) => {console.log(s)},
});