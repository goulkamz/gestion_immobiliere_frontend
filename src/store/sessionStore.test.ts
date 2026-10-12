import { beforeEach, describe, expect, it } from "vitest";
import { useSessionStore, selectIsAuthenticated, selectRole } from "./sessionStore";
import type { ProfileResponse } from "@/api/types";

const profile: ProfileResponse = {
  idUser: 1,
  email: "client@gestimmo.test",
  nom: "Kone",
  prenom: "Ibrahim",
  sexe: "M",
  telephone: null,
  telephone1: null,
  dateNaissance: "1990-01-01",
  role: "ROLE_CLIENT",
};

describe("sessionStore", () => {
  beforeEach(() => {
    useSessionStore.getState().clear();
  });

  it("démarre non authentifié", () => {
    expect(selectIsAuthenticated(useSessionStore.getState())).toBe(false);
  });

  it("expose le profil et le rôle après setProfile", () => {
    useSessionStore.getState().setProfile(profile);
    const state = useSessionStore.getState();
    expect(selectIsAuthenticated(state)).toBe(true);
    expect(selectRole(state)).toBe("ROLE_CLIENT");
  });

  it("efface le profil au clear", () => {
    useSessionStore.getState().setProfile(profile);
    useSessionStore.getState().clear();
    expect(selectIsAuthenticated(useSessionStore.getState())).toBe(false);
  });
});
