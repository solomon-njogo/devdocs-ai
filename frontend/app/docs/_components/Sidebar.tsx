"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavGroup {
  label: string;
  layer: string;
  items: { title: string; slug: string }[];
}

const LAYER_ICON: Record<string, string> = {
  quickstart: "🚀",
  concept: "💡",
  howto: "🔧",
  reference: "📖",
};

export function NavTree({
  tree,
  projectSlug,
}: {
  tree: NavGroup[];
  projectSlug: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {tree.map((group) => (
        <div key={group.layer}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {LAYER_ICON[group.layer] ?? ""} {group.label}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = `/docs/${projectSlug}/${item.slug}`;
              const isActive = pathname === href;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
