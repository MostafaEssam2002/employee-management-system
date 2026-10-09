jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));
import { ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ROLE } from '../generated/prisma/enums';

const HASHED = '$2b$10$hashedhashedhashedhashedhashedhashedhashedhashedhashed';

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Alex Morgan',
  email: 'alex@example.com',
  role: ROLE.Employee,
  password: HASHED,
  ...overrides,
});

const registerDto = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  role: ROLE.Employee,
  password: 'password123',
};

describe('UserService', () => {
  let service: UserService;

  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const hashMock = bcrypt.hash as unknown as jest.Mock;

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    hashMock.mockResolvedValue(HASHED);

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(UserService);
  });

  // -------------------------------------------------------------- register
  describe('register', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(makeUser());
    });

    it('hashes the password with 10 salt rounds and stores the hash, not the plain text', async () => {
      await service.register(registerDto);

      expect(hashMock).toHaveBeenCalledWith('password123', 10);
      const { data } = prisma.user.create.mock.calls[0][0];
      expect(data.password).toBe(HASHED);
      expect(data.password).not.toBe('password123');
    });

    it('never returns the password', async () => {
      const result = await service.register(registerDto);

      expect(result.message).toBe('User created successfully');
      expect(result.data).not.toHaveProperty('password');
      expect(result.data).toEqual({
        id: 1,
        name: 'Alex Morgan',
        email: 'alex@example.com',
        role: ROLE.Employee,
      });
    });

    it('does not mutate the dto it receives', async () => {
      const dto = { ...registerDto };

      await service.register(dto);

      expect(dto.password).toBe('password123');
    });

    it.each([ROLE.Admin, ROLE.Manager, ROLE.Employee])(
      'keeps the requested role (%s) — an admin may create any role',
      async (role) => {
        await service.register({ ...registerDto, role });

        expect(prisma.user.create.mock.calls[0][0].data.role).toBe(role);
      },
    );

    it('throws ConflictException when the email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(hashMock).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------- findAll
  describe('findAll', () => {
    beforeEach(() => {
      prisma.user.findMany.mockResolvedValue([makeUser({ password: undefined })]);
      prisma.user.count.mockResolvedValue(25);
    });

    it('paginates with 10 users per page', async () => {
      await service.findAll(3);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('defaults to the first page', async () => {
      await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('never selects the password column', async () => {
      await service.findAll();

      const { select } = prisma.user.findMany.mock.calls[0][0];
      expect(select).toEqual({ id: true, name: true, email: true, role: true });
      expect(select).not.toHaveProperty('password');
    });

    it('computes the pagination details from the user count', async () => {
      const result = await service.findAll(2);

      expect(result.pagination).toEqual({
        currentPage: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  // --------------------------------------------------------------- findOne
  describe('findOne', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('returns the user and never selects the password column', async () => {
      const safeUser = { id: 1, name: 'Alex Morgan', email: 'alex@example.com', role: ROLE.Employee };
      prisma.user.findUnique.mockResolvedValue(safeUser);

      const result = await service.findOne(1);

      expect(result.data).toEqual(safeUser);
      const { select } = prisma.user.findUnique.mock.calls[0][0];
      expect(select).not.toHaveProperty('password');
    });
  });

  // ---------------------------------------------------------------- update
  describe('update', () => {
    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.user.update.mockResolvedValue(makeUser());
    });

    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update(1, { name: 'New' })).rejects.toThrow(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('hashes the new password BEFORE saving it (never stores plain text)', async () => {
      await service.update(1, { password: 'newPassword123' });

      expect(hashMock).toHaveBeenCalledWith('newPassword123', 10);
      const { data } = prisma.user.update.mock.calls[0][0];
      expect(data.password).toBe(HASHED);
      expect(data.password).not.toBe('newPassword123');
    });

    it('does not hash anything when no password is sent', async () => {
      await service.update(1, { name: 'New Name' });

      expect(hashMock).not.toHaveBeenCalled();
      expect(prisma.user.update.mock.calls[0][0].data).toEqual({ name: 'New Name' });
    });

    it('does not mutate the dto it receives', async () => {
      const dto = { password: 'newPassword123' };

      await service.update(1, dto);

      expect(dto.password).toBe('newPassword123');
    });

    it('never returns the password', async () => {
      const result = await service.update(1, { name: 'New Name' });

      expect(result.message).toBe('user updated successfully');
      expect(result.data).not.toHaveProperty('password');
    });
  });

  // ---------------------------------------------------------------- remove
  describe('remove', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('deletes the user and returns it without the password', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());
      prisma.user.delete.mockResolvedValue(makeUser());

      const result = await service.remove(1);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.data).not.toHaveProperty('password');
      expect(result.data.id).toBe(1);
    });
  });
});