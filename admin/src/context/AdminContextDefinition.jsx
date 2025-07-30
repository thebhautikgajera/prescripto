import { createContext } from "react";

// Create context with default values
export const AdminContext = createContext({
  token: null,
  setToken: () => {},
  admin: null,
  setAdmin: () => {},
  loading: false,
  authLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: () => {}
}); 