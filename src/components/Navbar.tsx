"use client";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-black text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-1 md:py-2 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center h-28 md:h-36 lg:h-40 select-none" aria-label="Chef Inga Home">
          <Image
            src="/CHEF.png"
            alt="Chef Inga"
            width={800}
            height={1200}
            priority
            className="h-28 md:h-36 lg:h-40 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/#about" className="hover:text-[#c9a97a] transition-colors">
            About
          </Link>
          <Link href="/#contact" className="hover:text-[#c9a97a] transition-colors">
            Contact
          </Link>
          {!session ? (
            <Link
              href="/login"
              className="bg-[#c9a97a] text-[#3b2a1a] px-4 py-2 rounded font-semibold hover:bg-[#b8956b] transition-colors"
            >
              Client Login
            </Link>
          ) : session.user.role === "CHEF" ? (
            <>
              <Link href="/chef/dashboard" className="hover:text-[#c9a97a] transition-colors">
                Chef Portal
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-[#c9a97a] text-[#3b2a1a] px-4 py-2 rounded font-semibold hover:bg-[#b8956b] transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/client/dashboard" className="hover:text-[#c9a97a] transition-colors">
                My Menu
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="bg-[#c9a97a] text-[#3b2a1a] px-4 py-2 rounded font-semibold hover:bg-[#b8956b] transition-colors"
              >
                Sign Out
              </button>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <span className="block w-6 h-0.5 bg-white mb-1" />
          <span className="block w-6 h-0.5 bg-white mb-1" />
          <span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#2e1f0f] px-4 pb-4 flex flex-col gap-3 text-sm">
          <Link href="/#about" onClick={() => setOpen(false)} className="hover:text-[#c9a97a]">
            About
          </Link>
          <Link href="/#contact" onClick={() => setOpen(false)} className="hover:text-[#c9a97a]">
            Contact
          </Link>
          {!session ? (
            <Link href="/login" onClick={() => setOpen(false)} className="hover:text-[#c9a97a]">
              Client Login
            </Link>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/" });
              }}
              className="text-left hover:text-[#c9a97a]"
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
