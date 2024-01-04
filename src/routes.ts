import { Router } from "express";
import { AuthenticateUserController } from "./controllers/AuthenticateUserController";
import { CreateMessageController } from "./controllers/CreateMessageController";
import { GetLast3MessageController } from "./controllers/GetLast3MessageController";
import { ProfileUserController } from "./controllers/ProfileUserController";
import { ensureAuthenticated } from "./middleware/ensureAuthenticated";

const router = Router();

const authenticateUserController = new AuthenticateUserController();

const createMessageController = new CreateMessageController();

const getLast3MessagesController = new GetLast3MessageController();
const profileUserController = new ProfileUserController();

router.post("/authenticate", authenticateUserController.handle);

router.post("/message", ensureAuthenticated, createMessageController.handle);

router.get("/message/last3", getLast3MessagesController.handle);

router.get("/profile", profileUserController.handle);

export { router };
