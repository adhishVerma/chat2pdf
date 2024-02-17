import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <>
    <Link href="/chat"><Button>Click to go to chat</Button></Link>
    </>
  );
}
