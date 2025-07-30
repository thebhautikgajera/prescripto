import AdminContextProvider from "./AdminContext";

// Export the AdminContextStore component that main.jsx is trying to import
export const AdminContextStore = ({ children }) => {
  return <AdminContextProvider>{children}</AdminContextProvider>;
}; 