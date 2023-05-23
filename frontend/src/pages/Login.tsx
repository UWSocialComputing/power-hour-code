import { FormEvent, useEffect, useRef, useState } from "react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material";

export function Login() {
  const { login, user, loginAfterSignup } = useAuth();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [accountCreateNotifOpen, setAccountCreateNotifOpen] = useState(false);
  useEffect(() => {
    setAccountCreateNotifOpen(loginAfterSignup);
  }, [loginAfterSignup]);

  const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setAccountCreateNotifOpen(false);
  }

  if (user != null) {
    return <Navigate to="/" />
  }
  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (login.isLoading) return;
    const username = usernameRef.current?.value;
    const password = passwordRef.current?.value;

    if (username == null || username === "" || password == null || password === "") {
      return;
    }
    login.mutate({id: username, password: password});
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>
      <Snackbar
        open={accountCreateNotifOpen}
        autoHideDuration={5000}
        onClose={handleClose}>
          <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          New account created!
        </Alert>
      </Snackbar>
      <form
        className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-5 items-center justify-items-end"
        onSubmit={handleSubmit}
      >
        <label htmlFor="userName">Username</label>
        <Input id="userName" required ref={usernameRef} />
        <label htmlFor="password">Password</label>
        <Input id="password" type="password" required ref={passwordRef} />
        <Button disabled={login.isLoading} type="submit" className="col-span-full">
          {login.isLoading ? "Loading..." : "Log in"}
        </Button>
      </form>
    </>
  );
}