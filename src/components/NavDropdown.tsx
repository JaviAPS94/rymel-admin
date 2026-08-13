import { useEffect, useRef, useState, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { IconChevronDown } from "@tabler/icons-react";
import { cn } from "@utils/cn";

export interface NavDropdownItem {
  path: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface NavDropdownProps {
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavDropdownItem[];
}

/**
 * Grouped nav entry: a trigger button that opens a panel listing its
 * sub-items. Used so the top-level navbar stays a fixed, small set of
 * categories — new screens go inside a group instead of growing the row
 * (the flat list + horizontal scroll it replaced didn't scale).
 */
export const NavDropdown = ({ label, icon: Icon, items }: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  const isActiveGroup = items.some((item) => item.path === location);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-lg text-sm font-medium transition-colors",
          isActiveGroup
            ? "bg-rymel-blue text-white"
            : "text-gray-700 hover:bg-gray-100",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
        <IconChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-gray-200 bg-white shadow-lg py-1">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const active = item.path === location;
            return (
              <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors",
                    active
                      ? "bg-rymel-blue/10 text-rymel-blue font-medium"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  <ItemIcon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
