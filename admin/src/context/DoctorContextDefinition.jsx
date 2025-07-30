import { createContext } from "react";

// Create context with default values
export const DoctorContext = createContext({
  token: null,
  setToken: () => {},
  doctor: null,
  setDoctor: () => {},
  loading: false,
  authLoading: true,
  error: null,
  login: async () => {},
  logout: () => {}
}); 