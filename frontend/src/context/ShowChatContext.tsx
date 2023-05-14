import { createContext } from 'react';

export const ShowChatContext = createContext((s: string) => {console.log(s)});