import { FastifyInstance } from "fastify";
import { StreamChat } from "stream-chat";

const streamChat = StreamChat.getInstance(
  process.env.STREAM_API_KEY!,
  process.env.STREAM_PRIVATE_API_KEY!
);

const TOKEN_USER_ID_MAP = new Map<string, string>();

export async function userRoutes(app: FastifyInstance) {
  app.post<{
    Body: {
      id: string;
      name: string;
      password: string
    }
  }>("/signup", async (req, res) => {
    const {id, name, password} = req.body;
    if (id === null || id === ""
      || name === null || name === ""
      || password == null || password === "") {
      return res.status(400).send();
    }
    // check for existing users, make sure there are no duplicates
    const existingUsers = await streamChat.queryUsers({ id });
    if (existingUsers.users.length > 0) {
      return res.status(400).send("User ID taken");
    }
    await streamChat.upsertUser({ id, name, password });
  });

  app.post<{
    Body: {
      id: string;
      password: string;
    }
  }>("/login", async (req, res) => {
    const { id, password } = req.body;
    if (id === null || id === "" || password == "null" || password === "") {
      return res.status(400).send();
    }

    const {users: [user]} = await streamChat.queryUsers({id});
    if (user == null || user.password !== password) {
      return res.status(401).send();
    }

    const token = streamChat.createToken(id);
    TOKEN_USER_ID_MAP.set(token, user.id);
    return {
      token,
      user: {name: user.name, id: user.id, password: user.password},
    }
  });

  app.post<{
    Body: {
      token: string;
    }
  }>("/logout", async (req, res) => {
    const token = req.body.token;
    if (token === null || token === "") {
      return res.status(400).send();
    }

    const id = TOKEN_USER_ID_MAP.get(token);
    if (id == null) return res.status(400).send();
    await streamChat.revokeUserToken(id, new Date());
    TOKEN_USER_ID_MAP.delete(token);
  });

  app.post<{
    Body: {
      channelId: string;
    }
  }>("/sendBotMessage", async (req, res) => {
    const channelId = req.body.channelId;
    if (channelId === null || channelId === "") {
      return res.status(400).send();
    }
    const channel = streamChat.channel("messaging", channelId);
    await channel.sendMessage({
      text: "Hi there! Welcome to a new collaboration session! As a reminder, here is the collaboration policy for CSE 311: ... Happy collaborating!",
      user_id: "bot"
    });
  })
}