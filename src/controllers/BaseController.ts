import { AuthRequest } from "../types/auth";

export default class BaseController {
  protected getPagination(req: AuthRequest) {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit as string) || 10, 1),
      100
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }
}
