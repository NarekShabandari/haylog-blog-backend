import "express-session";
import { User } from "./index.js";

declare module "express-session" {
  interface SessionData {
    user: User;
  }
}
