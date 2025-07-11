import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} EquiShare. All rights reserved.
        </p>

        <div className="flex items-center">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </footer>
  );
}
