import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col gap-6 justify-center items-center px-4 text-center">
      <h1 className="max-w-3xl text-balance text-3xl font-semibold sm:text-4xl md:text-5xl">Chat with any PDF of your choice</h1>
      <Link href="/chat"><Button>Click to go to chat</Button></Link>
    </div>
  );
}
