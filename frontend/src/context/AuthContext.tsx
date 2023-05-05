import { UseMutationResult, useMutation } from "@tanstack/react-query";
import axios, {AxiosResponse} from "axios";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreamChat } from "stream-chat";
import { useLocalStorage } from "../hooks/useLocalStorage";

// Define all info needed for an authed state
type AuthContext = {
  // data in response, error, value to passed into actual function
  user?: User,
  streamChat?: StreamChat,
  signup: UseMutationResult<AxiosResponse, unknown, User>
  login: UseMutationResult<{token: string, user: User}, unknown, string>,
  logout: UseMutationResult<AxiosResponse, unknown, void>,
};

type User = {
  id: string,
  name: string,
  image?: string
}
const Context = createContext<AuthContext | null>(null);

// For other files to retrieve auth info
export function useAuth() {
  return useContext(Context) as AuthContext;
}

// For other files to retrieve auth info assuming users have logged in
export function useLoggedInAuth() {
  return useContext(Context) as AuthContext & Required<Pick<AuthContext, "user">>;
}

type AuthProviderProps = {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  // Store logged in user and their token in local storage so they will
  // be logged in automatically upon refresh
  const [user, setUser] = useLocalStorage<User>("user");
  const [token, setToken] = useLocalStorage<string>("token");
  const [streamChat, setStreamChat] = useState<StreamChat>();

  const signup = useMutation({
    mutationFn: (user: User) => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/signup`, user);
    },
    onSuccess() {
      navigate("/login");
    }
  });

  const login = useMutation({
    mutationFn: (id: string) => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/login`, {id})
        .then(res => {
          // token for validation, user object for info display
          return res.data as {token: string, user: User}
        });
    },
    onSuccess(data) {
      setUser(data.user);
      setToken(data.token);
    }
  });

  const logout = useMutation({
    mutationFn: () => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/logout`, {token});
    },
    onSuccess() {
      setUser(undefined);
      setToken(undefined);
      setStreamChat(undefined);
    }
  })

  useEffect(() => {
    // do nothing if user invalid
    if (token == null || user == null) return;

    // create new chat app
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const chat = new StreamChat(import.meta.env.VITE_STREAM_API_KEY!);

    // don't login the same user again
    if (chat.tokenManager.token === token && chat.userID === user.id) {
      return;
    }

    let isInterrupted = false;
    // try connect user
    const connectPromise = chat.connectUser(user, token).then(() => {
      if (isInterrupted) return;
      setStreamChat(chat);
    });
    return () => {
      // change interrupted state if we somehow call this again
      isInterrupted = true;
      // will clear chat and disconnect if login again
      setStreamChat(undefined);
      connectPromise.then(() => {
        chat.disconnectUser()
      })
    }
  }, [token, user]);
  return <Context.Provider value={{ signup, login, user, streamChat, logout}}>
    {children}
  </Context.Provider>
}