import Link from "next/link";
import type { Metadata } from "next";
import { BookOpenText, Copy, Lock, MessageSquareText, Quote, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "ChatPdf · Ask your PDFs anything",
  description: "Upload a PDF and ask questions in plain language. Answers cite the page they came from, so you can check them in one click.",
  openGraph: {
    title: "ChatPdf · Ask your PDFs anything",
    description: "Upload a PDF and ask questions in plain language. Answers cite the page they came from.",
    type: "website",
  },
};

const FEATURES = [
  { icon: Quote, title: "Answers with page references", body: "Every answer points to the pages it used. Tap a reference and the PDF opens right there." },
  { icon: MessageSquareText, title: "Follow-up questions", body: "Ask “and what about the exceptions?” and it knows what you mean from the conversation so far." },
  { icon: BookOpenText, title: "Built-in PDF viewer", body: "Read the document next to the chat, zoom in, and jump between pages without leaving the app." },
  { icon: Smartphone, title: "Works on your phone", body: "Switch between the chat and the PDF with one tap. No app to install." },
  { icon: Lock, title: "Private by default", body: "Your PDFs are stored privately and only you can open them. Delete a chat or your account any time." },
  { icon: Copy, title: "Rename and copy", body: "Give chats names you’ll recognise, and copy any answer as tidy Markdown for your notes." },
];

const STEPS = [
  { title: "Upload a PDF", body: "Drop in a contract, a paper, a manual or your notes, up to 10 MB." },
  { title: "Ask a question", body: "Type it the way you'd ask a colleague. No keywords or special syntax." },
  { title: "Check the source", body: "Read the answer, then tap its page reference to see the original text." },
];

// A static picture of the product, drawn with HTML so it stays sharp and themes with the page.
function ProductPreview() {
  return (
    <div aria-hidden className="w-full max-w-md rounded-xl border bg-card p-4 text-left shadow-lg">
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2.5 rounded-full bg-red-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-green-400" />
        <span className="ml-2 truncate">tenancy-agreement.pdf</span>
      </div>
      <div className="mb-3 rounded-lg border p-3 text-sm">
        <div className="mb-1 font-semibold text-amber-500 dark:text-amber-300">You</div>
        How much notice do I need to give before moving out?
      </div>
      <div className="rounded-lg border p-3 text-sm">
        <div className="mb-1 font-semibold text-blue-500 dark:text-blue-300">AI</div>
        You need to give <strong>two months&apos; written notice</strong>, ending on the last day of a rent period
        (<span className="text-blue-600 underline decoration-dotted underline-offset-2 dark:text-blue-300">p. 4</span>).
        If you leave earlier, you still owe rent until the notice ends
        (<span className="text-blue-600 underline decoration-dotted underline-offset-2 dark:text-blue-300">p. 5</span>).
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await getSession();
  const primary = session
    ? { href: "/chat", label: "Go to your chats" }
    : { href: "/sign-up", label: "Get started" };

  // the root layout fixes the page height, so this page scrolls on its own
  return (
    <div className="h-full overflow-y-auto">
      <main className="mx-auto flex max-w-6xl flex-col gap-24 px-4 pb-16 pt-10 sm:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">Chat with any PDF</span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Ask your PDFs anything. Get answers you can check.
            </h1>
            <p className="max-w-xl text-pretty text-lg text-muted-foreground">
              Upload a document and ask questions in plain language. Every answer cites the page it came from,
              so you can verify it in one click instead of reading the whole thing.
            </p>
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start" data-landing-cta>
              <Link href={primary.href}><Button size="lg">{primary.label}</Button></Link>
              {!session && <Link href="/sign-in"><Button size="lg" variant="outline">Sign in</Button></Link>}
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ProductPreview />
          </div>
        </section>

        <section aria-labelledby="how" className="flex flex-col gap-8">
          <h2 id="how" className="text-center text-2xl font-semibold sm:text-3xl">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl border p-5">
                <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</div>
                <h3 className="mb-1 font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="features" className="flex flex-col gap-8">
          <h2 id="features" className="text-center text-2xl font-semibold sm:text-3xl">Built for reading, not guessing</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border p-5">
                <Icon className="mb-3 size-5 opacity-70" aria-hidden />
                <h3 className="mb-1 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/40 px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Stop skimming. Start asking.</h2>
          <p className="max-w-lg text-muted-foreground">Upload your first PDF in under a minute.</p>
          <Link href={primary.href}><Button size="lg">{primary.label}</Button></Link>
        </section>
      </main>
      <footer className="border-t px-4 py-6 text-center text-xs text-muted-foreground">
        ChatPdf · Answers are generated by AI and can be wrong. Check the cited pages for anything important.
      </footer>
    </div>
  );
}
