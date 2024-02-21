import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
      <div className="flex items-center">
        <h1 className="mr-3 text-5xl font-semibold">Chat with any PDF of your choice</h1>
      </div>
      <Link href="/chat"><Button>Click to go to chat</Button></Link>
    </div>
  );
}
