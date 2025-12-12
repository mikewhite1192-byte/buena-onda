// app/_header.tsx (server component OK)
import Link from 'next/link';

export default function Header() {
  return (
    <Link
      href="/sign-in"
      className="rounded-xl bg-onda-teal px-4 py-2 text-white inline-flex"
    >
      Sign in
    </Link>
  );
}
