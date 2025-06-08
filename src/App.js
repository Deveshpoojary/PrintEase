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
import Main from "./components/Main";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from './admin/AdminDashboard';
import NotFoundPage from './components/NotFoundPage';
import ViewDocs from './pages/ViewDocs';

// Your Clerk publishable key
const PUBLISHABLE_KEY = "pk_test_aGFwcHktbWFydGVuLTI3LmNsZXJrLmFjY291bnRzLmRldiQ"; // Replace this with your actual Clerk publishable key

function App() {
  return (
    // <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/sign-in" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up" element={<SignUp routing="path" path="/sign-up" />} />
          
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
                <AdminDashboard />
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
