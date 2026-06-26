import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/user/userSlice";
import type { UserState } from "./slices/user/userSlice";

// Définir le type de l'état racine
export type RootState = {
  user: UserState;
};

// Configurer et exporter le store
export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware({
  //   serializableCheck: {
  //     ignoredActions: ['routes/setRoutes'],
  //   }
  // })
});

// Déduire le type `AppDispatch` du store lui-même
export type AppDispatch = typeof store.dispatch;

export default store;