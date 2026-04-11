"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavGroup {
  label: string;
  layer: string;
  items: { title: string; slug: string }[];
}

export function NavTree({
  tree,
  projectSlug,
}: {
  tree: NavGroup[];
  projectSlug: string;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-7">
      {tree.map((group) => (
        <div key={group.layer}>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-2">
            {group.label}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = `/docs/${projectSlug}/${item.slug}`;
              const isActive = pathname === href;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    className={`flex items-center rounded-md px-2 py-[6px] text-[13.5px] transition-colors relative ${
                      isActive
                        ? "text-primary font-medium bg-primary/[0.06]"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-primary" />
                    )}
                    <span className={isActive ? "pl-2" : ""}>{item.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
