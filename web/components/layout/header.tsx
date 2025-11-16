"use client"

import { ExternalLink, LogIn, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrivy } from "@privy-io/react-auth"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { ready, authenticated, login, logout } = usePrivy()

  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold">FluxA Monetization</h1>

          <Button asChild variant="ghost">
            <Link href="/">Monetize</Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-1">
                Browse
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/browse-servers?type=mcp" className="cursor-pointer">
                  MCPs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/browse-servers?type=api" className="cursor-pointer">
                  APIs
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          {authenticated && (
            <Button asChild variant="ghost">
              <Link href="/my-monetization">My Monetization</Link>
            </Button>
          )}

          <Button asChild variant="outline" className="flex items-center gap-2 bg-transparent">
            <a href="https://agentwallet.fluxapay.xyz/" target="_blank" rel="noopener noreferrer">
              Visit Agent Wallet
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>

          {ready && (
            <>
              {authenticated ? (
                <Button
                  onClick={logout}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  onClick={login}
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
