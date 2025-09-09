import './App.css';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  RedirectToSignIn,
  useUser,
} from "@clerk/clerk-react";

// Import your components/pages
import Main from "./components/Main.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import NotFoundPage from './components/NotFoundPage.jsx';
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import ViewDocs from './pages/ViewDocs.jsx';
import AdminPanel from './admin/AdminPanel.jsx';
import SuccessPage from './pages/SuccessPage.jsx';

// Your Clerk publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY; // Replace this with your actual Clerk publishable key

function App() {
  return (
    // <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/success" element={<SuccessPage />} />

          
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth>
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              </RequireAuth>
            }
          />

          <Route
            path="/viewdocs"
            element={
              <RequireAuth>
                <ViewDocs />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    // </ClerkProvider>
  );
}

// Protect routes with Clerk Auth
const RequireAuth = ({ children }) => {
  const { isSignedIn } = useUser();

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return children;
};

export default App;
