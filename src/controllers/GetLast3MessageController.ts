import { Request, Response } from "express";
import { GetLast3MessageService } from "../services/GetLast3MessageService";

class GetLast3MessageController {
  async handle(request: Request, response: Response) {
    const getLast3MessageService = new GetLast3MessageService();

    const result = await getLast3MessageService.execute();

    return response.json(result);
  }
}

export { GetLast3MessageController };
