import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import SignOutButton from "@/components/auth/SignOutButton";
import VerifyEmailBanner from "@/components/auth/VerifyEmailBanner";
import { emailVerificationRequired } from "@/lib/auth";
import DemoBanner from "@/components/demo/DemoBanner";

const Header = async () => {
    const session = await getSession();

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
                    {session ? (
                        <>
                            <Link href="/account" className="hidden sm:inline text-sm opacity-75 hover:underline" title="Account settings">{session.email}</Link>
                            <Link href="/account" className="sm:hidden"><Button variant="ghost" size="sm">Account</Button></Link>
                            <SignOutButton />
                        </>
                    ) : (
                        <Link href="/sign-in"><Button variant="outline" size="sm">Sign in</Button></Link>
                    )}
                </div>
            </nav>
            {session?.isDemo && <DemoBanner />}
            {session && !session.isDemo && !session.emailVerified && emailVerificationRequired() && <VerifyEmailBanner email={session.email} />}
        </div>
    )
}

export default Header
