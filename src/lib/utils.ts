import { type ClassValue, clsx } from "clsx"
import { Message } from 'ai'
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formattedSourceText(inputText: string) {
  return inputText
    .replace(/\n+/g, " ")
    .replace(/(\w) - (\w)/g, "$1$2")
    .replace(/\s+/g, " ")
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function scrollToEnd(containerRef: React.RefObject<HTMLElement>) {
  if (containerRef.current) {
    const lastMessage = containerRef.current.lastElementChild;
    if (lastMessage) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "end"
      }
      lastMessage.scrollIntoView(scrollOptions)
    }
  }
}

// maps the sources with the right ai-message
export const getSources = (data : any[], role: string, index: number) => {
  if(role === 'assistant' && index >= 2 && (index-2) % 2 === 0){
    const sourcesIndex = (index-2)/2;
    if(data[sourcesIndex] && data[sourcesIndex].sources){
      return data[sourcesIndex].sources;
    }
  }
  return [];
}

export const initialMessages: Message[] = [
  { role: 'assistant', content: "Hey I am you AI assistant, I can answer questions about your PDF on ipc(indian penal code)", id: "0" },
]