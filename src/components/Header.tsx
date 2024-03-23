import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { UserButton, SignInButton, auth } from "@clerk/nextjs";
import Image from "next/image";

const Header = () => {
    const { userId } = auth();

    return (
        <div className="w-screen p-2 grow-0 ">
            <nav className="w-full flex mx-auto items-center justify-between">
                <Link href="/">
                    <div className="flex gap-3 items-center">
                        <span>
                            <Image alt="site-logo" src="/icon.png" width={128} height={128} className="w-8 h-8" /></span>ChatPdf
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