import { prisma } from '../../lib/prisma';
import { encryptionService } from '../../utils/encryption';
import { plaidService } from '../plaid/plaid.service';
import { logger } from '../../utils/logger';

class UserService {
  async deleteAccount(userId: string): Promise<void> {
    // Revoke Plaid items
    const items = await prisma.plaidItem.findMany({ where: { userId } });
    for (const item of items) {
      try {
        const token = encryptionService.decrypt(item.accessToken);
        await plaidService.removeItem(token);
      } catch (error) {
        logger.error('Failed to revoke Plaid access', { itemId: item.id, error });
      }
    }

    // Delete user (cascade deletes related data)
    await prisma.user.delete({ where: { id: userId } });
  }
}

export const userService = new UserService();
export default userService;
