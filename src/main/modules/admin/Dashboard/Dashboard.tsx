import type { ReactNode } from "react";
import { useCookies } from "react-cookie";

interface DashboardProps {
  children?: ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  const [cookies] = useCookies(["user"]);

  return (
    <>
      <h1>Bienvenue Dashboard</h1>
    </>
  );
}
