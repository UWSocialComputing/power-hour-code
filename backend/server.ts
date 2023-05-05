import { config } from "dotenv";
config();

import fastify from "fastify";
import cors from "@fastify/cors";
import { userRoutes } from "./routes/users";

const app = fastify();
app.register(cors, { origin: (origin, cb) => {
  const hostname = new URL(origin!).hostname
  if(hostname === "localhost"){
    //  Request from localhost will pass
    cb(null, true)
    return;
  }
  // Generate an error on other origins, disabling access
  cb(new Error("Not allowed"), false);
} })
console.log("hi");
app.register(userRoutes);

app.listen({ port: parseInt(process.env.PORT!) });