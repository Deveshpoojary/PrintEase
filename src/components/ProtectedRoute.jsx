// ProtectedRoute.js
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { isSignedIn, user } = useUser();

  // List of authorized admin emails
  const ADMIN_EMAILS = ["2024mca066@mite.ac.in", "2024mca061@mite.ac.in"];

  if (!isSignedIn) {
    return <Navigate to="/signin" />; // Not signed in
  }

  const userEmail = user?.primaryEmailAddress?.emailAddress;

  if (!ADMIN_EMAILS.includes(userEmail)) {
    return <Navigate to="/unauthorized" />; // Not an authorized admin
  }

  return children; // Authorized user, allow access
};

export default ProtectedRoute;
