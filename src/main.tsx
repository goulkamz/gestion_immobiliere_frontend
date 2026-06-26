import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./main/App";
import reportWebVitals from "../reportWebVitals";
import { Provider } from "react-redux";
import store from "./main/features/redux/store";
import { CookiesProvider } from "react-cookie";
import { BrowserRouter } from "react-router-dom";

// Création du root avec typage
const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <Provider store={store}>
    <CookiesProvider defaultSetOptions={{ path: "/" }}>
      <BrowserRouter>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </BrowserRouter>
    </CookiesProvider>
  </Provider>,
);

// Mesure des performances
reportWebVitals((metric) => {
  // En développement : afficher dans la console
  if (process.env.NODE_ENV === "development") {
    console.log(`${metric.name}: ${metric.value}`);
  }

  // En production : envoyer à un service d'analyse
  if (process.env.NODE_ENV === "production") {
    //Exemple avec Google Analytics
    // gtag("event", metric.name, { value: metric.value });
  }
});
