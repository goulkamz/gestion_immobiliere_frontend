import { default as publicRoutes } from "./public/routes";
import { default as clientRoutes } from "./client/routes";
import { default as adminRoutes } from "./admin/routes";
import { default as authRoutes } from "./auth/routes";
import React from "react";

// Définition du type pour une route individuelle
export interface RouteConfig {
  path: string;
  name: string;
  Component: React.ComponentType<any>;
  icon?: string | null;
  exact?: boolean;
  end?: boolean;
}

// Définition du type pour l'objet routes
export interface RoutesObject {
  [key: string]: RouteConfig;
}

// Définition du type pour un module
export interface Module {
  name: string;
  routes: RoutesObject;
}

// Définition du type pour l'objet modules principal
export interface Modules {
  public: Module;
  client: Module;
  admin: Module;
  auth: Module;
}

// Fonction utilitaire pour créer une route typée
export function setRoute(
  path: string,
  name: string,
  Component: React.ComponentType<any>,
  icon: string | null = null,
  exact: boolean = true,
  end: boolean = false,
): RouteConfig {
  return {
    path,
    name,
    Component,
    icon,
    exact,
    end,
  };
}

// Création de l'objet modules typé
const modules: Modules = {
  public: {
    name: "PUBLIC",
    routes: publicRoutes as RoutesObject,
  },
  client: {
    name: "ROLE_CLIENT",
    routes: clientRoutes as RoutesObject,
  },
  admin: {
    name: "ROLE_ADMIN",
    routes: adminRoutes as RoutesObject,
  },
  auth: {
    name: "AUTH",
    routes: authRoutes as RoutesObject,
  },
};

export default modules;
