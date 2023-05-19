import {
  UseMutationResult,
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import axios, {AxiosResponse} from "axios";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StreamChat } from "stream-chat";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { socket } from "../socket";

// Define all info needed for an authed state
type AuthContext = {
  // data in response, error, value to passed into actual function
  user?: User,
  streamChat?: StreamChat,
  loginAfterSignup: boolean,
  signup: UseMutationResult<AxiosResponse, unknown, User>
  login: UseMutationResult<{token: string, user: User}, unknown, LoginInfo>,
  logout: UseMutationResult<AxiosResponse, unknown, void>,
  joinQueue: UseMutationResult<AxiosResponse, unknown, QueueEntryInfo>,
  modifyRequest: UseMutationResult<AxiosResponse, unknown, QueueEntryInfo>,
  leaveQueue: UseMutationResult<AxiosResponse, unknown, string>,
};

type User = {
  id: string,
  name: string,
  password: string
}

type LoginInfo = {
  id: string,
  password: string
}

type QueueEntryInfo = {
  inPersonOnline: string,
  id: string,
  name: string,
  openToCollaboration: boolean,
  question: string,
  questionType: string
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
  const queryClient = useQueryClient();
  // Store logged in user and their token in local storage so they will
  // be logged in automatically upon refresh
  const [user, setUser] = useLocalStorage<User>("user");
  const [token, setToken] = useLocalStorage<string>("token");
  const [streamChat, setStreamChat] = useState<StreamChat>();
  const [loginAfterSignup, setLoginAfterSignup] = useState(false);

  const signup = useMutation({
    mutationFn: (user: User) => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/signup`, user);
    },
    onSuccess() {
      setLoginAfterSignup(true);
      navigate("/login");
    }
  });

  const login = useMutation({
    mutationFn: (loginInfo: LoginInfo) => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/login`, loginInfo)
        .then(res => {
          // token for validation, user object for info display
          return res.data as {token: string, user: User}
        });
    },
    onSuccess(data) {
      setUser(data.user);
      setToken(data.token);
      socket.emit("subscribe-notification", {"id": data.user.id});
    }
  });

  const logout = useMutation({
    mutationFn: () => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/logout`, {token});
    },
    onSuccess() {
      socket.emit("unsubscribe-notification", {"id": user?.id})
      setUser(undefined);
      setToken(undefined);
      setStreamChat(undefined);
    }
  });

  const joinQueue = useMutation({
    mutationFn: (joinQueueInfo: QueueEntryInfo) => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/join-queue`, joinQueueInfo);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['getQueueData'] })
    },
  });

  const modifyRequest = useMutation({
    mutationFn: (modifyRequestInfo: QueueEntryInfo) => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/modify-request`, modifyRequestInfo);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['getQueueData'] })
    },
  });

  const leaveQueue = useMutation({
    mutationFn: (id: string) => {
      return axios.post(`${import.meta.env.VITE_SERVER_URL}/leave-queue`, {id});
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['getQueueData'] })
    },
  });

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
  return <Context.Provider value={{ user, streamChat, loginAfterSignup, signup, login, logout, joinQueue, modifyRequest, leaveQueue}}>
    {children}
  </Context.Provider>
}