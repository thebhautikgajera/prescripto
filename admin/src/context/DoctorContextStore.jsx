import DoctorContextProvider from "./DoctorContext";

// Export the DoctorContextStore component that main.jsx is trying to import
export const DoctorContextStore = ({ children }) => {
  return <DoctorContextProvider>{children}</DoctorContextProvider>;
}; 