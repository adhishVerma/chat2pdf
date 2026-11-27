'use client'

import Balancer from "react-wrap-balancer"
import Markdown from 'react-markdown'
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";
import { formattedSourceText, type Message, type Source } from "@/lib/utils";

const wrappedText = (text: string) =>
  text.split("\n").map((line, index) => (
    <span key={index}>
      {line}
      <br />
    </span>
  ));

interface ChatBubbleProps extends Partial<Message> {
  sources: Source[]
};

const ChatBubble = ({
  role = "assistant",
  content,
  sources,
}: ChatBubbleProps) => {
  const wrappedMessage = content ? wrappedText(content) : [];

  return (
    <Card className="mb-3">
      <CardHeader>
        <CardTitle className={
          role != 'assistant' ? "text-amber-500 dark:text-amber-300"
            : "text-blue-500 dark:text-blue-300"
        }>
          {role == 'assistant' ? "AI" : "You"}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {!wrappedMessage.length && <Skeleton className="h-2.5 rounded-sm" />}
        <Balancer>{wrappedMessage}</Balancer>
      </CardContent>
      <CardFooter>
        <CardDescription className="w-full">
          {sources && sources.length ? (<Accordion type="single" collapsible className="w-full">
            {sources.map((source, index) => (
              <AccordionItem value={`source-${index}`} key={index}>
                <AccordionTrigger>{`Source ${index + 1}${source.page ? ` · page ${source.page}` : ""}`}</AccordionTrigger>
                <AccordionContent>
                  <Markdown>
                    {formattedSourceText(source.content)}
                  </Markdown>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>)
            : (<></>)
          }

        </CardDescription>
      </CardFooter>
    </Card>
  )
}

export default ChatBubble