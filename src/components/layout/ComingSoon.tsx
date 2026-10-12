import { PageHeader, PageLayout, EmptyState } from "@/components/ui";
import { Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
}

/** Placeholder pour les modules pas encore livrés (phases suivantes de la reconstruction). */
export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <PageLayout>
      <PageHeader title={title} />
      <EmptyState icon={<Construction size={36} />} title="Module en cours de construction" description="Cette section arrive dans une prochaine itération." />
    </PageLayout>
  );
}
