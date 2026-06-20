"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/chef/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/chef/menus", label: "Menus & Quotes", icon: "🧾" },
  { href: "/chef/requests", label: "Requests", icon: "📨" },
  { href: "/chef/recipes", label: "Recipes", icon: "📋" },
  { href: "/chef/clients", label: "Clients", icon: "👥" },
];

export default function ChefSidebar() {
  const path = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-52 bg-white border-r border-gray-200 pt-8">
      <nav className="flex flex-col gap-1 px-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              path.startsWith(l.href)
                ? "bg-[#3b2a1a] text-white"
                : "text-gray-700 hover:bg-[#faf5ef]"
            }`}
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
