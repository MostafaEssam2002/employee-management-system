// Not under test here: the Prisma client wrapper (needs a database / ESM deps)
jest.mock('src/prisma/prisma.service', () => ({ PrismaService: class {} }));

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';

describe('UserService update/remove rules', () => {
  const alice = { id: 1, name: 'Alice', email: 'alice@x.com', role: 'Admin', password: 'h' };
  const bob = { id: 2, name: 'Bob', email: 'bob@x.com', role: 'Employee', password: 'h' };
  let prisma: any;
  let service: UserService;

  beforeEach(() => {
    const users = [alice, bob];
    prisma = {
      user: {
        findUnique: jest.fn(({ where }) => Promise.resolve(users.find((u) => u.id === where.id || u.email === where.email) ?? null)),
        update: jest.fn(({ where, data }) => Promise.resolve({ ...users.find((u) => u.id === where.id), ...data })),
        delete: jest.fn(({ where }) => Promise.resolve(users.find((u) => u.id === where.id))),
      },
    };
    service = new UserService(prisma);
  });

  it('rejects deleting your own account', async () => {
    await expect(service.remove(1, 1)).rejects.toThrow(BadRequestException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('deletes another user and never returns the password', async () => {
    const res = await service.remove(2, 1);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(res.data).not.toHaveProperty('password');
  });

  it('404s when the user does not exist', async () => {
    await expect(service.remove(99, 1)).rejects.toThrow(NotFoundException);
    await expect(service.update(99, { name: 'x' }, 1)).rejects.toThrow(NotFoundException);
  });

  it('rejects changing your own role but allows other changes to yourself', async () => {
    await expect(service.update(1, { role: 'Manager' as any }, 1)).rejects.toThrow('You cannot change your own role');
    await expect(service.update(1, { name: 'Alice B' }, 1)).resolves.toBeDefined();
    // "changing" to the role you already have is a no-op, not an error
    await expect(service.update(1, { role: 'Admin' as any }, 1)).resolves.toBeDefined();
  });

  it('lets an admin change another user\'s role', async () => {
    const res = await service.update(2, { role: 'Manager' as any }, 1);
    expect(res.data.role).toBe('Manager');
  });

  it('rejects an email that belongs to another user, allows keeping your own', async () => {
    await expect(service.update(2, { email: 'alice@x.com' }, 1)).rejects.toThrow(ConflictException);
    await expect(service.update(2, { email: 'bob@x.com' }, 1)).resolves.toBeDefined();
    await expect(service.update(2, { email: 'new@x.com' }, 1)).resolves.toBeDefined();
  });

  it('hashes a new password and never returns it', async () => {
    const res = await service.update(2, { password: 'newpassword1' }, 1);
    const saved = prisma.user.update.mock.calls[0][0].data.password;
    expect(saved).not.toBe('newpassword1');
    expect(saved).toMatch(/^\$2[aby]\$/);
    expect(res.data).not.toHaveProperty('password');
  });
});
