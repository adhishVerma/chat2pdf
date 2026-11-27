'use client'

import Markdown from 'react-markdown'
import { FileText } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../ui/accordion";
import { formattedSourceText, linkPageRefs, type Message, type Source } from "@/lib/utils";
import { useAStore } from '@/store/store';

interface ChatBubbleProps extends Partial<Message> {
  sources: Source[]
};

function PageLink({ page, children }: { page: number; children: React.ReactNode }) {
  const goToPage = useAStore((state) => state.goToPage);
  return (
    <button
      type="button"
      onClick={() => goToPage(page)}
      className="underline decoration-dotted underline-offset-2 text-blue-600 dark:text-blue-300 hover:decoration-solid"
      title={`Show page ${page} in the PDF`}
    >
      {children}
    </button>
  );
}

const ChatBubble = ({
  role = "assistant",
  content,
  sources,
}: ChatBubbleProps) => {
  const goToPage = useAStore((state) => state.goToPage);

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
        {!content && <Skeleton className="h-2.5 rounded-sm" />}
        {content && role === 'assistant' && (
          <div className="markdown">
            <Markdown
              components={{
                a: ({ href, children }) => {
                  const match = href?.match(/^#page=(\d+)$/);
                  if (match) return <PageLink page={parseInt(match[1])}>{children}</PageLink>;
                  return <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline">{children}</a>;
                },
              }}
            >
              {linkPageRefs(content)}
            </Markdown>
          </div>
        )}
        {content && role !== 'assistant' && <p className="whitespace-pre-wrap">{content}</p>}
      </CardContent>
      <CardFooter>
        <CardDescription className="w-full">
          {sources && sources.length ? (<Accordion type="single" collapsible className="w-full">
            {sources.map((source, index) => (
              <AccordionItem value={`source-${index}`} key={index}>
                <AccordionTrigger>{`Source ${index + 1}${source.page ? ` · page ${source.page}` : ""}`}</AccordionTrigger>
                <AccordionContent>
                  {source.page > 0 && (
                    <button
                      type="button"
                      onClick={() => goToPage(source.page)}
                      className="mb-2 inline-flex items-center gap-1 text-xs underline text-blue-600 dark:text-blue-300"
                    >
                      <FileText className="h-3 w-3" /> Show page {source.page} in the PDF
                    </button>
                  )}
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
