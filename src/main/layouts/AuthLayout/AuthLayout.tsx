import type { ReactNode } from "react";
import "./AuthLayout.scss";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <section id="AuthLayout">{children}</section>;
}
