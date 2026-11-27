import { type ClassValue, clsx } from "clsx"
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

export function scrollToEnd(containerRef: React.RefObject<HTMLElement | null>) {
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

export type Source = { content: string; page: number }

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export const initialMessagesTemplate: Message[] = [
  { role: 'assistant', content: "Hey I am you AI assistant, I can answer questions about your PDF", id: "0" },
]

export function nameChecker(file_name:string){
  for (let index = 0; index < file_name.length; index++) {
    if (file_name.charCodeAt(index) < 32 || file_name.charCodeAt(index) > 126){
      return false
    }
  }
  return true
}