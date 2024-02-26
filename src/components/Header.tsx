import { ModeToggle } from "@/components/mode-toggle";
import { FileText } from "lucide-react";
import Link from "next/link";
import { UserButton, SignInButton, auth } from "@clerk/nextjs";

const Header = () => {
    const { userId } = auth();

    return (
        <div className="w-screen p-2 grow-0">
            <nav className="w-full flex  mx-auto items-center justify-between">
                <Link href="/">
                    <div className="flex gap-2 items-center">
                        <span><FileText className="h-[1.2rem] w-[1.2rem]" /></span>ChatPdf
                    </div>
                </Link>
                <div className="flex gap-2 items-center">
                    <ModeToggle />
                    {userId ? <UserButton /> : <SignInButton />}
                </div>
            </nav>
        </div>
    )
}

export default Header