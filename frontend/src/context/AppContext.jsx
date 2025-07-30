import { createContext } from "react";

// Create the context with default values
const AppContext = createContext({
  doctors: [],
  loading: false,
  error: null,
  currencySymbol: '₹',
  user: null,
  isAuthenticated: false,
  authLoading: true,
  setUser: () => {},
  login: () => {},
  logout: () => {}
});

export default AppContext;