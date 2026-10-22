"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const svg = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const items = [
  { href: "/", label: "Panel", icon: <svg {...svg}><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg> },
  { href: "/productos", label: "Productos", icon: <svg {...svg}><path d="M21 8l-9-5-9 5v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg> },
  { href: "/materiales", label: "Materiales", icon: <svg {...svg}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg> },
  { href: "/ventas", label: "Ventas", icon: <svg {...svg}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg> },
  { href: "/mas", label: "Más", icon: <svg {...svg}><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg> },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottomnav" aria-label="Principal">
      {items.map((it) => {
        const activo = it.href === "/" ? path === "/" : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={activo ? "activo" : undefined} aria-current={activo ? "page" : undefined}>
            {it.icon}
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
