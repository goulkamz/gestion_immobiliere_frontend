import { act, fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteCombobox } from "./RemoteCombobox";
import type { RemoteComboboxResult } from "./RemoteCombobox";

const appels: string[] = [];
const TOUS = [
  { value: 1, label: "Alice Martin" },
  { value: 2, label: "Bob Durand" },
  { value: 150, label: "Zoe Lointaine" },
];

// Simule le serveur : filtre sur le texte reçu
function useFaux(recherche: string): RemoteComboboxResult {
  appels.push(recherche);
  const options = TOUS.filter((o) => o.label.toLowerCase().includes(recherche.toLowerCase()));
  return { options, total: options.length + 40 };
}

let soumis: unknown = null;
let resetForm: () => void = () => {};

function Formulaire() {
  const { register, handleSubmit, watch, reset } = useForm<{ idClient: string }>();
  resetForm = () => reset({ idClient: "" });
  return (
    <form
      onSubmit={handleSubmit((v) => {
        soumis = v;
      })}
    >
      <RemoteCombobox label="Client" useOptions={useFaux} value={watch("idClient")} {...register("idClient")} />
      <button type="submit">Envoyer</button>
    </form>
  );
}

describe("RemoteCombobox", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    appels.length = 0;
    soumis = null;
  });
  afterEach(() => vi.useRealTimers());

  it("envoie la valeur choisie via register, même absente des résultats suivants", () => {
    render(<Formulaire />);
    const champ = screen.getByRole("combobox");
    fireEvent.focus(champ);
    fireEvent.mouseDown(screen.getByRole("option", { name: "Zoe Lointaine" }));
    expect((champ as HTMLInputElement).value).toBe("Zoe Lointaine");

    // Nouvelle recherche qui ne contient plus Zoe : la sélection reste affichée et envoyée
    fireEvent.change(champ, { target: { value: "bob" } });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole("option", { name: "Zoe Lointaine" })).toBeNull();
    fireEvent.keyDown(champ, { key: "Escape" });
    expect((champ as HTMLInputElement).value).toBe("Zoe Lointaine");

    fireEvent.click(screen.getByText("Envoyer"));
    return vi.waitFor(() => expect(soumis).toEqual({ idClient: "150" }));
  });

  it("n'appelle le serveur avec le texte saisi qu'après 300 ms", () => {
    render(<Formulaire />);
    const champ = screen.getByRole("combobox");
    fireEvent.change(champ, { target: { value: "ali" } });
    expect(appels.includes("ali")).toBe(false);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(appels.includes("ali")).toBe(true);
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("se commande au clavier : flèches, Entrée (sans envoyer le formulaire), Échap", () => {
    render(<Formulaire />);
    const champ = screen.getByRole("combobox");
    fireEvent.keyDown(champ, { key: "ArrowDown" });
    expect(champ.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(champ, { key: "ArrowDown" });
    fireEvent.keyDown(champ, { key: "Enter" });
    expect((champ as HTMLInputElement).value).toBe("Bob Durand");
    expect(champ.getAttribute("aria-expanded")).toBe("false");
    expect(soumis).toBeNull();

    fireEvent.keyDown(champ, { key: "ArrowDown" });
    fireEvent.keyDown(champ, { key: "Escape" });
    expect(champ.getAttribute("aria-expanded")).toBe("false");
  });

  it("signale une liste tronquée", () => {
    render(<Formulaire />);
    fireEvent.focus(screen.getByRole("combobox"));
    expect(screen.getByText(/3 premiers résultats sur 43/)).toBeTruthy();
  });

  it("vide l'affichage quand le formulaire est réinitialisé", () => {
    render(<Formulaire />);
    const champ = screen.getByRole("combobox") as HTMLInputElement;
    fireEvent.focus(champ);
    fireEvent.mouseDown(screen.getByRole("option", { name: "Alice Martin" }));
    expect(champ.value).toBe("Alice Martin");
    act(() => resetForm());
    expect(champ.value).toBe("");
  });
});
