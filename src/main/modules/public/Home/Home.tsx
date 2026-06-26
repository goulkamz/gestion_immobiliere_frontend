import AppLayout from "../../../layouts/AppLayout/AppLayout";
import "./Home.scss";

interface HomeProps {
  // Ajoutez vos props ici si nécessaire
}

export default function Home({}: HomeProps) {
  return (
    <AppLayout>
      <h1>Bienvenue Home</h1>
    </AppLayout>
  );
}
