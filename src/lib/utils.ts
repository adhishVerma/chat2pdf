import { type ClassValue, clsx } from "clsx"
import { Message } from 'ai'
import { twMerge } from "tailwind-merge"
import axios from "axios"

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
export const getSources = (data: any[], role: string, index: number) => {
  if (role === 'assistant' && index >= 2 && (index - 2) % 2 === 0) {
    const sourcesIndex = (index - 2) / 2;
    if (data[sourcesIndex] && data[sourcesIndex].sources) {
      return data[sourcesIndex].sources;
    }
  }
  return [];
}

export const initialMessagesTemplate: Message[] = [
  { role: 'assistant', content: "Hey I am you AI assistant, I can answer questions about your PDF", id: "0" },
]

export function convertToAscii(inputString: string) {
  // remove non ascii characters
  const asciiString = inputString.replace(/[^\x00-\x7F]+/g, "");
  return asciiString;
}

export async function lambdaPreparePDF(file_key: string) {
  const response = await axios.get(`${process.env.LAMBDA_URL}/?file_key=${file_key}`)
  return response
}

export function nameChecker(file_name:string){
  for (let index = 0; index < file_name.length; index++) {
    if (file_name.charCodeAt(index) < 32 || file_name.charCodeAt(index) > 126){
      return false
    }
  }
  return true
}