import { Outlet, createBrowserRouter } from "react-router-dom";
import { AuthLayout } from "./pages/layouts/AuthLayout";
import { Signup } from "./pages/Signup";
import { Login } from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import { RootLayout } from "./pages/layouts/RootLayout";
import { Home } from "./pages/Home";
import { NewChannel } from "./pages/channel/new";

// Outlet enables rendering different layouts depending on the state of the
// app (login/signup or in chat)
function ContextWrapper() {
  return <AuthProvider>
      <Outlet />
    </AuthProvider>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ContextWrapper />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "/channel", children: [
            { path: "new", element: <NewChannel /> }
          ]}
        ]
      },
      {
        element: <AuthLayout />,
        children: [
          { path: "login", element: <Login />},
          { path: "signup", element: <Signup />},
        ]
      }
    ],
  }
]);