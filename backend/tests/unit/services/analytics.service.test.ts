import { AnalyticsService } from '../../../src/services/analytics/analytics.service';
import { prisma } from '../../../src/lib/prisma';

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
    recurringTransaction: { findMany: jest.fn() },
  },
}));

describe('AnalyticsService', () => {
  const service = new AnalyticsService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getMonthlyCashFlow returns formatted results', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([
      { month: new Date('2024-01-01'), income: 200, expenses: 100 },
    ]);
    const res = await service.getMonthlyCashFlow('u1', new Date('2024-01-01'), new Date('2024-01-31'));
    expect(res).toEqual([{ month: '2024-01', income: 200, expenses: 100, net: 100 }]);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('getRecurringTransactions queries prisma', async () => {
    (prisma.recurringTransaction.findMany as jest.Mock).mockResolvedValue([{ id: 'r1' }]);
    const res = await service.getRecurringTransactions('user');
    expect(res).toEqual([{ id: 'r1' }]);
    expect(prisma.recurringTransaction.findMany).toHaveBeenCalledWith({
      where: { userId: 'user', isActive: true },
      include: { transactions: true, category: true, account: true },
    });
  });
});
