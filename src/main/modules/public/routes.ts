import { setRoute } from "../modules";
import type { RoutesObject } from "../modules";
import Book from "./Book/Book";
import Home from "./Home/Home";
import Map from "./Map/Map";

const routes: RoutesObject = {
  Home: setRoute("/", "Home", Home),
  Carte: setRoute("/map", "Carte", Map),
  Book: setRoute("/book/trip/:tripId", "Réservation", Book),
  Service: setRoute("/", "Service", Home),
  Location: setRoute("/map", "Location", Map),
  Offers: setRoute("/book/trip/:tripId", "Offres", Book),
};

export default routes;
