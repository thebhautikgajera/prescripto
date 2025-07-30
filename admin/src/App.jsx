import React from 'react'
import { Navigate } from 'react-router-dom'

const App = () => {
  // Redirect to login page from the root path
  return <Navigate to="/login" replace />;
}

export default App