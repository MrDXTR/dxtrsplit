"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 border-b backdrop-blur"
    >
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center space-x-2 transition-opacity hover:opacity-80"
        >
          <Image src="/file.svg" alt="DxtrSplit" width={32} height={32} />
          <span className="text-xl font-bold tracking-tight">DxtrSplit</span>
        </Link>

        <nav className="flex items-center gap-6">
          {status === "loading" ? (
            <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ) : session ? (
            <div className="flex items-center gap-4">
              <Link href="/groups">
                <Button variant="ghost" className="font-medium">
                  Groups
                </Button>
              </Link>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Avatar className="h-10 w-10 border-2 border-gray-200 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600">
                      <AvatarImage
                        src={session.user?.image || ""}
                        alt={session.user?.name || "User"}
                      />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold text-white">
                        {session.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user?.name && (
                        <p className="text-sm font-medium">
                          {session.user.name}
                        </p>
                      )}
                      {session.user?.email && (
                        <p className="text-muted-foreground text-xs">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="my-1 border-t"></div>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button
                onClick={() => router.push("/signin")}
                className="font-medium"
              >
                Sign In
              </Button>
            </div>
          )}
        </nav>
      </div>
    </motion.header>
  );
}
