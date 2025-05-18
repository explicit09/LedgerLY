import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user/user.service';
import { sendSuccess } from '../utils/apiResponse';

export class UserController {
  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      await userService.deleteAccount(userId);
      return sendSuccess(res, 'Account deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
