import React from "react";
import { Route, Routes } from "react-router-dom";

// Définition du type pour une route individuelle
interface RouteConfig {
  path: string;
  exact?: boolean;
  Component: React.ComponentType<any>;
}

// Définition du type pour l'objet routes
interface RoutesObject {
  [key: string]: RouteConfig;
}

// Définition des props du composant
interface RouteComponentsProps {
  routes: RoutesObject;
}

export default function RouteComponents({ routes }: RouteComponentsProps) {
  const UserRoutes: React.ReactElement[] = [];

  for (const routeName in routes) {
    const route = routes[routeName];
    UserRoutes.push(
      <Route
        path={route.path}
        element={<route.Component />}
        key={routeName}
      />,
    );
  }

  return (
    <Routes>
      {UserRoutes.map((UserRoute) => UserRoute)}
      <Route path={"*"} element={null} />
    </Routes>
  );
}
