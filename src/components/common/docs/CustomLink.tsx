import type React from "react";

interface CustomLinkProps {
  href: string;
  children: React.ReactNode;
}

export function CustomLink({ href, children }: CustomLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline font-bold hover:bg-[#2effff] hover:text-black rounded-md p-1"
    >
      {children}
    </a>
  );
}

export function CustomMailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="underline font-bold hover:bg-[#2effff] hover:text-black rounded-md p-1"
    >
      {email}
    </a>
  );
}
