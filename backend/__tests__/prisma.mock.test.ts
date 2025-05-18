import { prisma } from './test-utils';

describe('Prisma Mock', () => {
  it('should mock Prisma Client methods', async () => {
    // Mock the return value for findMany
    prisma.user.findMany.mockResolvedValue([
      { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' },
    ]);

    // Call the mocked method
    const users = await prisma.user.findMany();

    // Assert the result
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe('test@example.com');

    // Verify the method was called
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
  });

  it('should allow mocking create operations', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashedpassword',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock the create method
    prisma.user.create.mockResolvedValue(mockUser);

    // Call the mocked method
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
      },
    });

    // Assert the result
    expect(user).toEqual(mockUser);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword',
      },
    });
  });
});
