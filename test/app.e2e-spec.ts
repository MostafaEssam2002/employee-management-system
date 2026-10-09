// No database is needed: PrismaService is replaced with an in-memory mock (see prismaMock below)
jest.mock('../src/prisma/prisma.service', () => ({ PrismaService: class {} }));
// The generated Prisma client is heavy; the exception filter only needs the error class for instanceof checks
jest.mock('../src/generated/prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, { code }: { code: string }) {
      super(message);
      this.code = code;
    }
  }
  return { Prisma: { PrismaClientKnownRequestError } };
});
import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception/http-exception.filter';
import { Prisma } from '../src/generated/prisma/client';
import { ROLE } from '../src/generated/prisma/enums';
import { PrismaService } from '../src/prisma/prisma.service';

const JWT_SECRET = 'e2e-test-secret';

describe('App (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  // JwtStrategy re-reads the user from the database on every request (the user must still exist and
  // the role must match the token), so user.findUnique has to answer for the users we sign tokens for.
  const authedUsers = new Map<number, ROLE>();
  const userRow = (id: number, role: ROLE) => ({
    id,
    email: `${role.toLowerCase()}@example.com`,
    role,
  });

  /** user.findUnique: lookups by id answer for tokens made by tokenFor(); any other lookup answers `fallback` */
  const mockUserLookup = (fallback: unknown) =>
    prismaMock.user.findUnique.mockImplementation(async ({ where }: any) =>
      where?.id !== undefined && authedUsers.has(where.id)
        ? userRow(where.id, authedUsers.get(where.id)!)
        : fallback,
    );

  /** a real JWT, signed by the app's own JwtService */
  const tokenFor = (role: ROLE, id = 1) => {
    authedUsers.set(id, role);
    return jwt.signAsync({ sub: id, email: `${role.toLowerCase()}@example.com`, role });
  };
  const bearer = async (role: ROLE) => `Bearer ${await tokenFor(role)}`;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    // keep in sync with src/main.ts
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    // after init: creating the app resets the logger, and the 500 test would otherwise print a stack trace
    Logger.overrideLogger(false);

    jwt = app.get(JwtService, { strict: false });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    // tokens made in a beforeAll stay registered in authedUsers, so it is not cleared here
    mockUserLookup(null);
  });

  // ------------------------------------------------------------------ root
  describe('GET /', () => {
    it('returns the welcome message', async () => {
      const res = await request(app.getHttpServer()).get('/').expect(200);

      expect(res.text).toBe('Hello World!');
    });

    it('answers an unknown route with a 404 in the standard error format', async () => {
      const res = await request(app.getHttpServer()).get('/nope').expect(404);

      expect(res.body).toEqual({
        success: false,
        statusCode: 404,
        message: 'Cannot GET /nope',
        path: '/nope',
        timestamp: expect.any(String),
      });
    });
  });

  // ------------------------------------------------------------------ auth
  describe('POST /auth/register', () => {
    const body = {
      name: 'Alex Morgan',
      email: 'alex@example.com',
      role: ROLE.Employee,
      password: 'password123',
    };

    beforeEach(() => {
      mockUserLookup(null);
      prismaMock.user.create.mockImplementation(async ({ data }) => ({ id: 7, ...data }));
    });

    it('creates an Employee and never returns the password', async () => {
      const res = await request(app.getHttpServer()).post('/auth/register').send(body).expect(201);

      expect(res.body).toEqual({
        message: 'User created successfully',
        data: { id: 7, name: 'Alex Morgan', email: 'alex@example.com', role: ROLE.Employee },
      });
    });

    it('stores a bcrypt hash of the password, not the plain text', async () => {
      await request(app.getHttpServer()).post('/auth/register').send(body).expect(201);

      const { data } = prismaMock.user.create.mock.calls[0][0];
      expect(data.password).not.toBe('password123');
      await expect(bcrypt.compare('password123', data.password)).resolves.toBe(true);
    });

    it('strips properties that are not part of the DTO', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...body, id: 999, isAdmin: true })
        .expect(201);

      const { data } = prismaMock.user.create.mock.calls[0][0];
      expect(data).not.toHaveProperty('isAdmin');
      expect(data).not.toHaveProperty('id');
    });

    it('rejects an empty body with the validation messages', async () => {
      const res = await request(app.getHttpServer()).post('/auth/register').send({}).expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'name should not be empty',
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ]),
      );
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('rejects a password shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...body, password: 'short' })
        .expect(400);

      expect(res.body.message).toContain('password must be longer than or equal to 8 characters');
    });

    it.each([ROLE.Admin, ROLE.Manager])('refuses to register the role %s', async (role) => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...body, role })
        .expect(400);

      expect(res.body.message).toBe('Invalid role for registration');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('answers 409 when the email is already registered', async () => {
      mockUserLookup({ email: body.email });

      const res = await request(app.getHttpServer()).post('/auth/register').send(body).expect(409);

      expect(res.body.message).toBe('Email already exists');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/login', () => {
    let storedUser: Record<string, unknown>;

    beforeAll(async () => {
      storedUser = {
        id: 1,
        name: 'Alex Morgan',
        email: 'admin@example.com',
        role: ROLE.Admin,
        password: await bcrypt.hash('password123', 4),
      };
    });

    it('returns the user details and a JWT for valid credentials', async () => {
      mockUserLookup(storedUser);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'password123' })
        .expect(201);

      expect(res.body.message).toBe('login Successfully');
      expect(res.body.data).toEqual({
        id: 1,
        name: 'Alex Morgan',
        email: 'admin@example.com',
        role: ROLE.Admin,
      });
      expect(JSON.stringify(res.body)).not.toContain(storedUser.password as string);

      const payload = await jwt.verifyAsync(res.body.token);
      expect(payload).toMatchObject({ sub: 1, email: 'admin@example.com', role: ROLE.Admin });
    });

    it('issues a token that really opens the Admin endpoints', async () => {
      mockUserLookup(storedUser);
      prismaMock.company.findMany.mockResolvedValue([]);
      prismaMock.company.count.mockResolvedValue(0);
      prismaMock.department.findMany.mockResolvedValue([]);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'password123' });

      await request(app.getHttpServer())
        .get('/company')
        .set('Authorization', `Bearer ${login.body.token}`)
        .expect(200);
    });

    it('answers 401 for a wrong password', async () => {
      mockUserLookup(storedUser);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'wrong-password' })
        .expect(401);

      expect(res.body.message).toBe('Invalid user credentials');
      expect(res.body.token).toBeUndefined();
    });

    it('answers 401 with the same message for an unknown email', async () => {
      mockUserLookup(null);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'ghost@example.com', password: 'password123' })
        .expect(401);

      expect(res.body.message).toBe('Invalid user credentials');
    });

    it('rejects a malformed email and a short password with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'short' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ]),
      );
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------- protected routes
  describe('protected routes (JwtAuthGuard + RolesGuard)', () => {
    const routes = ['/company', '/department', '/employee', '/user'];

    it.each(routes)('GET %s without a token answers 401', async (path) => {
      const res = await request(app.getHttpServer()).get(path).expect(401);

      expect(res.body).toMatchObject({ success: false, statusCode: 401, message: 'Unauthorized' });
    });

    it.each(routes)('GET %s with a garbage token answers 401', async (path) => {
      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);
    });

    it.each(routes)('GET %s with a token signed by another secret answers 401', async (path) => {
      const forged = await new JwtService({ secret: 'other-secret' }).signAsync({
        sub: 1,
        email: 'admin@example.com',
        role: ROLE.Admin,
      });

      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${forged}`)
        .expect(401);
    });

    it.each(routes)('GET %s with an expired token answers 401', async (path) => {
      const expired = await jwt.signAsync(
        { sub: 1, email: 'admin@example.com', role: ROLE.Admin },
        { expiresIn: -60 },
      );

      await request(app.getHttpServer())
        .get(path)
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
    });

    it.each(routes)('GET %s with the Authorization scheme missing answers 401', async (path) => {
      const token = await tokenFor(ROLE.Admin);

      await request(app.getHttpServer()).get(path).set('Authorization', token).expect(401);
    });

    describe.each([ROLE.Employee, ROLE.Manager])('as %s', (role) => {
      it.each(routes)('GET %s answers 403', async (path) => {
        const res = await request(app.getHttpServer())
          .get(path)
          .set('Authorization', await bearer(role))
          .expect(403);

        expect(res.body).toMatchObject({
          success: false,
          statusCode: 403,
          message: 'You do not have permission',
        });
      });

      it('POST /company answers 403 and creates nothing', async () => {
        await request(app.getHttpServer())
          .post('/company')
          .set('Authorization', await bearer(role))
          .send({ name: 'Acme' })
          .expect(403);

        expect(prismaMock.company.create).not.toHaveBeenCalled();
      });
    });
  });

  // --------------------------------------------------------------- company
  describe('company (as Admin)', () => {
    let auth: string;

    beforeAll(async () => {
      auth = await bearer(ROLE.Admin);
    });

    it('GET /company lists a page of companies with their counts and pagination', async () => {
      prismaMock.company.findMany.mockResolvedValue([
        { id: 11, name: 'Acme', _count: { departments: 2 } },
      ]);
      prismaMock.company.count.mockResolvedValue(12);
      prismaMock.department.findMany.mockResolvedValue([
        { companyId: 11, _count: { employees: 3 } },
      ]);

      const res = await request(app.getHttpServer())
        .get('/company?page=2')
        .set('Authorization', auth)
        .expect(200);

      expect(prismaMock.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
      expect(res.body).toEqual({
        message: 'Companies retrieved successfully',
        data: [{ id: 11, name: 'Acme', numberOfDepartments: 2, numberOfEmployees: 3 }],
        pagination: { page: 2, limit: 10, total: 12, totalPages: 2 },
      });
    });

    it('GET /company defaults to the first page', async () => {
      prismaMock.company.findMany.mockResolvedValue([]);
      prismaMock.company.count.mockResolvedValue(0);
      prismaMock.department.findMany.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/company').set('Authorization', auth).expect(200);

      expect(prismaMock.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it.each(['0', '-1', 'abc', '1.5'])('GET /company?page=%s answers 400', async (page) => {
      await request(app.getHttpServer())
        .get(`/company?page=${page}`)
        .set('Authorization', auth)
        .expect(400);

      expect(prismaMock.company.findMany).not.toHaveBeenCalled();
    });

    it('GET /company/:id returns the company with its counts', async () => {
      prismaMock.company.findUnique.mockResolvedValue({ name: 'Acme', _count: { departments: 1 } });
      prismaMock.employee.count.mockResolvedValue(4);

      const res = await request(app.getHttpServer())
        .get('/company/5')
        .set('Authorization', auth)
        .expect(200);

      expect(res.body).toEqual({
        message: 'Company fetched successfully',
        data: { name: 'Acme', numberOfDepartments: 1, numberOfEmployees: 4 },
      });
    });

    it('GET /company/:id answers 404 in the standard error format', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);
      prismaMock.employee.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .get('/company/99')
        .set('Authorization', auth)
        .expect(404);

      expect(res.body).toEqual({
        success: false,
        statusCode: 404,
        message: 'Company not found',
        path: '/company/99',
        timestamp: expect.any(String),
      });
      expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('POST /company trims the name and answers 201', async () => {
      prismaMock.company.create.mockResolvedValue({ id: 1, name: 'Acme' });

      const res = await request(app.getHttpServer())
        .post('/company')
        .set('Authorization', auth)
        .send({ name: '  Acme  ' })
        .expect(201);

      expect(prismaMock.company.create).toHaveBeenCalledWith({ data: { name: 'Acme' } });
      expect(res.body).toEqual({
        message: 'Company Created Successfully',
        data: { id: 1, name: 'Acme' },
      });
    });

    it('POST /company rejects an empty name with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/company')
        .set('Authorization', auth)
        .send({ name: '' })
        .expect(400);

      expect(res.body.message).toContain('name should not be empty');
      expect(prismaMock.company.create).not.toHaveBeenCalled();
    });

    it('POST /company rejects a body without a name with 400', async () => {
      await request(app.getHttpServer())
        .post('/company')
        .set('Authorization', auth)
        .send({})
        .expect(400);
    });

    it('PATCH /company/:id updates the company', async () => {
      prismaMock.company.findUnique.mockResolvedValue({ id: 3, name: 'Old' });
      prismaMock.company.update.mockResolvedValue({ id: 3, name: 'New' });

      const res = await request(app.getHttpServer())
        .patch('/company/3')
        .set('Authorization', auth)
        .send({ name: 'New' })
        .expect(200);

      expect(prismaMock.company.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { name: 'New' },
      });
      expect(res.body.data).toEqual({ id: 3, name: 'New' });
    });

    it('DELETE /company/:id deletes the company', async () => {
      prismaMock.company.findUnique.mockResolvedValue({ id: 3, name: 'Acme' });
      prismaMock.company.delete.mockResolvedValue({ id: 3, name: 'Acme' });

      const res = await request(app.getHttpServer())
        .delete('/company/3')
        .set('Authorization', auth)
        .expect(200);

      expect(prismaMock.company.delete).toHaveBeenCalledWith({ where: { id: 3 } });
      expect(res.body.data).toEqual({ id: 3, name: 'Acme' });
    });

    it('DELETE /company/:id answers 404 for a company that does not exist', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/company/99')
        .set('Authorization', auth)
        .expect(404);

      expect(prismaMock.company.delete).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------ department
  describe('department (as Admin)', () => {
    let auth: string;

    beforeAll(async () => {
      auth = await bearer(ROLE.Admin);
    });

    it('POST /department creates a department inside an existing company', async () => {
      prismaMock.company.findUnique.mockResolvedValue({ id: 1, name: 'Acme' });
      prismaMock.department.create.mockResolvedValue({ id: 1, name: 'Engineering', companyId: 1 });

      const res = await request(app.getHttpServer())
        .post('/department')
        .set('Authorization', auth)
        .send({ name: 'Engineering', companyId: 1 })
        .expect(201);

      expect(res.body).toEqual({
        message: 'department created successfully',
        data: { id: 1, name: 'Engineering', companyId: 1 },
      });
    });

    it('POST /department answers 404 when the company does not exist', async () => {
      prismaMock.company.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/department')
        .set('Authorization', auth)
        .send({ name: 'Engineering', companyId: 99 })
        .expect(404);

      expect(res.body.message).toBe('Company not found');
      expect(prismaMock.department.create).not.toHaveBeenCalled();
    });

    it('POST /department rejects a companyId that is not a number with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/department')
        .set('Authorization', auth)
        .send({ name: 'Engineering', companyId: 'one' })
        .expect(400);

      expect(res.body.message).toContain(
        'companyId must be a number conforming to the specified constraints',
      );
    });

    it('PATCH /department/:id answers 400 for an invalid companyId', async () => {
      prismaMock.department.findUnique.mockResolvedValue({ id: 1, name: 'Eng', companyId: 1 });

      const res = await request(app.getHttpServer())
        .patch('/department/1')
        .set('Authorization', auth)
        .send({ companyId: -5 })
        .expect(400);

      expect(res.body.message).toBe('CompanyId must be a valid number');
      expect(prismaMock.department.update).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ user
  describe('user (as Admin)', () => {
    it('POST /user lets an Admin create a Manager, unlike /auth/register', async () => {
      mockUserLookup(null);
      prismaMock.user.create.mockImplementation(async ({ data }) => ({ id: 3, ...data }));

      const res = await request(app.getHttpServer())
        .post('/user')
        .set('Authorization', await bearer(ROLE.Admin))
        .send({
          name: 'Sam Lee',
          email: 'sam@example.com',
          role: ROLE.Manager,
          password: 'password123',
        })
        .expect(201);

      expect(res.body.data).toEqual({
        id: 3,
        name: 'Sam Lee',
        email: 'sam@example.com',
        role: ROLE.Manager,
      });
      expect(res.body.data).not.toHaveProperty('password');
    });
  });

  // ------------------------------------------------------------- employee
  describe('employee (as Admin)', () => {
    let auth: string;

    const DAY = 24 * 60 * 60 * 1000;
    const daysAgoISO = (days: number) => new Date(Date.now() - days * DAY).toISOString();
    const daysAheadISO = (days: number) => new Date(Date.now() + days * DAY).toISOString();

    const body = {
      name: 'Alex Morgan',
      email: 'alex@example.com',
      mobile: '+12025550123',
      address: '123 Main Street',
      departmentId: 1,
      designation: 'Software Engineer',
      companyId: 5,
    };

    // A tiny in-memory employee table, so the whole workflow can be driven through HTTP
    // (create -> PATCH -> PATCH -> GET) without a real database.
    const rows = new Map<number, any>();
    let nextId = 1;
    const defined = (data: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

    const installFakeEmployeeTable = () => {
      rows.clear();
      nextId = 1;
      // every department belongs to company 5, unless a test says otherwise
      prismaMock.department.findUnique.mockResolvedValue({ companyId: 5 });
      prismaMock.employee.findUnique.mockImplementation(async ({ where }: any) =>
        where.id !== undefined
          ? (rows.get(where.id) ?? null)
          : ([...rows.values()].find((row) => row.email === where.email) ?? null),
      );
      prismaMock.employee.create.mockImplementation(async ({ data }: any) => {
        const row = { id: nextId++, ...defined(data) };
        rows.set(row.id, row);
        return row;
      });
      prismaMock.employee.update.mockImplementation(async ({ where, data }: any) => {
        const row = { ...rows.get(where.id), ...defined(data) };
        rows.set(where.id, row);
        return row;
      });
      prismaMock.employee.delete.mockImplementation(async ({ where }: any) => {
        const row = rows.get(where.id);
        rows.delete(where.id);
        return row;
      });
      prismaMock.employee.findMany.mockImplementation(async () => [...rows.values()]);
      prismaMock.employee.count.mockImplementation(async () => rows.size);
    };

    const create = (overrides: Record<string, unknown> = {}) =>
      request(app.getHttpServer())
        .post('/employee')
        .set('Authorization', auth)
        .send({ ...body, ...overrides });

    const patch = (id: number, payload: Record<string, unknown>) =>
      request(app.getHttpServer())
        .patch(`/employee/${id}`)
        .set('Authorization', auth)
        .send(payload);

    const get = (id: number) =>
      request(app.getHttpServer()).get(`/employee/${id}`).set('Authorization', auth);

    /** creates an employee and walks it to the given status through the real workflow */
    const createAt = async (status?: 'INTERVIEW_SCHEDULED' | 'NOT_ACCEPTED' | 'HIRED') => {
      const created = await create().expect(201);
      const id: number = created.body.data.employee.id;
      if (status === 'NOT_ACCEPTED') await patch(id, { status }).expect(200);
      if (status === 'INTERVIEW_SCHEDULED' || status === 'HIRED') {
        await patch(id, { status: 'INTERVIEW_SCHEDULED' }).expect(200);
      }
      if (status === 'HIRED') await patch(id, { status }).expect(200);
      return id;
    };

    beforeAll(async () => {
      auth = await bearer(ROLE.Admin);
    });

    beforeEach(() => {
      installFakeEmployeeTable();
    });

    // ------------------------------------------------------------ create
    describe('POST /employee', () => {
      it('creates the employee at APPLICATION_RECEIVED with no hiredOn', async () => {
        const res = await create().expect(201);

        expect(res.body.message).toBe('employee created successfully');
        expect(res.body.data.employee).toMatchObject({
          id: 1,
          name: 'Alex Morgan',
          email: 'alex@example.com',
          status: 'APPLICATION_RECEIVED',
          hiredOn: null,
        });
      });

      it('does not store companyId (it is only used to validate the department)', async () => {
        await create().expect(201);

        expect(rows.get(1)).not.toHaveProperty('companyId');
        expect(rows.get(1).departmentId).toBe(1);
      });

      it('ignores a status and a hiredOn sent by the client', async () => {
        const res = await create({
          status: 'HIRED',
          hiredOn: '2026-01-01T00:00:00.000Z',
        }).expect(201);

        expect(res.body.data.employee.status).toBe('APPLICATION_RECEIVED');
        expect(res.body.data.employee.hiredOn).toBeNull();
      });

      it('answers 400 with the validation messages for an empty body', async () => {
        const res = await request(app.getHttpServer())
          .post('/employee')
          .set('Authorization', auth)
          .send({})
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(Array.isArray(res.body.message)).toBe(true);
        expect(res.body.message.length).toBeGreaterThan(0);
        expect(prismaMock.employee.create).not.toHaveBeenCalled();
      });

      it.each([
        ['an invalid email', { email: 'not-an-email' }],
        ['an invalid mobile number', { mobile: '12345' }],
        ['a mobile number that is not a number', { mobile: 'abc' }],
        ['a missing companyId', { companyId: undefined }],
        ['a departmentId that is not a number', { departmentId: 'abc' }],
        ['an empty name', { name: '' }],
      ])('answers 400 for %s', async (_label, overrides) => {
        await create(overrides).expect(400);

        expect(prismaMock.employee.create).not.toHaveBeenCalled();
      });

      it('answers 404 when the department does not exist', async () => {
        prismaMock.department.findUnique.mockResolvedValue(null);

        const res = await create().expect(404);

        expect(res.body).toMatchObject({
          success: false,
          statusCode: 404,
          message: 'Department not found',
        });
        expect(prismaMock.employee.create).not.toHaveBeenCalled();
      });

      it('answers 400 when the department belongs to another company', async () => {
        const res = await create({ companyId: 9 }).expect(400);

        expect(res.body.message).toBe('Department does not belong to the selected company');
        expect(prismaMock.employee.create).not.toHaveBeenCalled();
      });

      it('answers 409 when the email is already used by another employee', async () => {
        await create().expect(201);

        const res = await create().expect(409);

        expect(res.body.message).toBe('Employee with this email already exists');
        expect(rows.size).toBe(1);
      });
    });

    // ---------------------------------------------------------- workflow
    describe('onboarding workflow (PATCH /employee/:id)', () => {
      it('walks APPLICATION_RECEIVED -> INTERVIEW_SCHEDULED -> HIRED and records hiredOn', async () => {
        const id = await createAt();

        const interview = await patch(id, { status: 'INTERVIEW_SCHEDULED' }).expect(200);
        expect(interview.body.data.newEmp).toMatchObject({
          status: 'INTERVIEW_SCHEDULED',
          hiredOn: null,
        });

        const hired = await patch(id, { status: 'HIRED' }).expect(200);
        expect(hired.body.data.newEmp.status).toBe('HIRED');
        const hiredOn = new Date(hired.body.data.newEmp.hiredOn).getTime();
        expect(Math.abs(Date.now() - hiredOn)).toBeLessThan(60 * 1000);

        const fetched = await get(id).expect(200);
        expect(fetched.body.data).toMatchObject({ status: 'HIRED', daysEmployed: 0 });
      });

      it('calculates daysEmployed from a past hiredOn sent together with HIRED', async () => {
        const id = await createAt('INTERVIEW_SCHEDULED');

        await patch(id, { status: 'HIRED', hiredOn: daysAgoISO(30) }).expect(200);

        const fetched = await get(id).expect(200);
        expect(fetched.body.data.daysEmployed).toBe(30);
      });

      it('rejects the jump APPLICATION_RECEIVED -> HIRED and leaves the status untouched', async () => {
        const id = await createAt();

        const res = await patch(id, { status: 'HIRED' }).expect(400);

        expect(res.body.message).toBe(
          'Cannot change status from APPLICATION_RECEIVED to HIRED',
        );
        expect(rows.get(id).status).toBe('APPLICATION_RECEIVED');
        expect(rows.get(id).hiredOn).toBeNull();
      });

      it('rejects going backwards (INTERVIEW_SCHEDULED -> APPLICATION_RECEIVED)', async () => {
        const id = await createAt('INTERVIEW_SCHEDULED');

        await patch(id, { status: 'APPLICATION_RECEIVED' }).expect(400);

        expect(rows.get(id).status).toBe('INTERVIEW_SCHEDULED');
      });

      it.each(['NOT_ACCEPTED', 'INTERVIEW_SCHEDULED', 'APPLICATION_RECEIVED'])(
        'treats HIRED as final: HIRED -> %s is rejected',
        async (target) => {
          const id = await createAt('HIRED');

          await patch(id, { status: target }).expect(400);

          expect(rows.get(id).status).toBe('HIRED');
          expect(rows.get(id).hiredOn).toBeInstanceOf(Date);
        },
      );

      it.each(['HIRED', 'INTERVIEW_SCHEDULED', 'APPLICATION_RECEIVED'])(
        'treats NOT_ACCEPTED as final: NOT_ACCEPTED -> %s is rejected',
        async (target) => {
          const id = await createAt('NOT_ACCEPTED');

          await patch(id, { status: target }).expect(400);

          expect(rows.get(id).status).toBe('NOT_ACCEPTED');
        },
      );

      it('allows NOT_ACCEPTED straight from APPLICATION_RECEIVED and from INTERVIEW_SCHEDULED', async () => {
        const first = await createAt();
        await patch(first, { status: 'NOT_ACCEPTED' }).expect(200);

        const second = await create({ email: 'second@example.com' }).expect(201);
        const secondId = second.body.data.employee.id;
        await patch(secondId, { status: 'INTERVIEW_SCHEDULED' }).expect(200);
        await patch(secondId, { status: 'NOT_ACCEPTED' }).expect(200);

        expect(rows.get(first).status).toBe('NOT_ACCEPTED');
        expect(rows.get(secondId).status).toBe('NOT_ACCEPTED');
      });

      it('answers 400 for a status that is not part of the workflow', async () => {
        const id = await createAt();

        await patch(id, { status: 'FIRED' }).expect(400);

        expect(rows.get(id).status).toBe('APPLICATION_RECEIVED');
      });
    });

    // ------------------------------------------------------------ hiredOn
    describe('hiredOn rules (PATCH /employee/:id)', () => {
      it('rejects a hiredOn in the future', async () => {
        const id = await createAt('INTERVIEW_SCHEDULED');

        const res = await patch(id, { status: 'HIRED', hiredOn: daysAheadISO(3) }).expect(400);

        expect(res.body.message).toBe('hiredOn cannot be a future date');
        expect(rows.get(id).status).toBe('INTERVIEW_SCHEDULED');
      });

      it('answers 400 for a hiredOn that is not a date', async () => {
        const id = await createAt('INTERVIEW_SCHEDULED');

        await patch(id, { status: 'HIRED', hiredOn: 'yesterday-ish' }).expect(400);
      });

      it('ignores a hiredOn sent for an employee who is not hired', async () => {
        const id = await createAt();

        await patch(id, { hiredOn: daysAgoISO(10) }).expect(200);

        expect(rows.get(id).hiredOn).toBeNull();
      });

      it('keeps hiredOn when other fields of a hired employee are edited', async () => {
        const id = await createAt('HIRED');
        const before = rows.get(id).hiredOn;

        await patch(id, { address: '456 Other Street' }).expect(200);

        expect(rows.get(id).address).toBe('456 Other Street');
        expect(rows.get(id).hiredOn).toEqual(before);
        expect(rows.get(id).status).toBe('HIRED');
      });
    });

    // --------------------------------------------- email / department rules
    describe('email and department rules (PATCH /employee/:id)', () => {
      it('answers 409 when the new email belongs to another employee', async () => {
        await create().expect(201);
        const second = await create({ email: 'second@example.com' }).expect(201);

        const res = await patch(second.body.data.employee.id, {
          email: 'alex@example.com',
        }).expect(409);

        expect(res.body.message).toBe('Employee with this email already exists');
        expect(rows.get(2).email).toBe('second@example.com');
      });

      it('accepts the employee own email unchanged', async () => {
        const id = await createAt();

        await patch(id, { email: 'alex@example.com', designation: 'Tech Lead' }).expect(200);

        expect(rows.get(id).designation).toBe('Tech Lead');
      });

      it('answers 400 when the new department belongs to another company', async () => {
        const id = await createAt();

        const res = await patch(id, { departmentId: 2, companyId: 9 }).expect(400);

        expect(res.body.message).toBe('Department does not belong to the selected company');
        expect(rows.get(id).departmentId).toBe(1);
      });

      it('moves the employee to another department of the same company', async () => {
        const id = await createAt();

        await patch(id, { departmentId: 2, companyId: 5 }).expect(200);

        expect(rows.get(id).departmentId).toBe(2);
        expect(rows.get(id)).not.toHaveProperty('companyId');
      });

      it('answers 404 when the new department does not exist', async () => {
        const id = await createAt();
        prismaMock.department.findUnique.mockResolvedValue(null);

        await patch(id, { departmentId: 99 }).expect(404);
      });

      it('answers 400 for an invalid email or mobile', async () => {
        const id = await createAt();

        await patch(id, { email: 'nope' }).expect(400);
        await patch(id, { mobile: '123' }).expect(400);
      });

      it('answers 404 for an employee that does not exist', async () => {
        const res = await patch(999, { address: 'x' }).expect(404);

        expect(res.body).toMatchObject({
          success: false,
          statusCode: 404,
          message: 'Employee not found',
        });
      });
    });

    // --------------------------------------------------------- read / delete
    describe('GET and DELETE', () => {
      it('GET /employee lists the employees with daysEmployed and pagination', async () => {
        const hiredId = await createAt('HIRED');
        await patch(hiredId, { hiredOn: daysAgoISO(5) }).expect(200);
        await create({ email: 'second@example.com' }).expect(201);

        const res = await request(app.getHttpServer())
          .get('/employee')
          .set('Authorization', auth)
          .expect(200);

        expect(res.body.data).toHaveLength(2);
        expect(res.body.data[0]).toMatchObject({ status: 'HIRED', daysEmployed: 5 });
        expect(res.body.data[1]).toMatchObject({
          status: 'APPLICATION_RECEIVED',
          daysEmployed: null,
        });
        expect(res.body.pagination).toMatchObject({
          currentPage: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        });
      });

      it('GET /employee?page=0 answers 400', async () => {
        await request(app.getHttpServer())
          .get('/employee?page=0')
          .set('Authorization', auth)
          .expect(400);
      });

      it('GET /employee/:id answers 404 in the standard error format', async () => {
        const res = await get(999).expect(404);

        expect(res.body).toMatchObject({
          success: false,
          statusCode: 404,
          message: 'Employee not found',
        });
      });

      it('DELETE /employee/:id removes the employee', async () => {
        const id = await createAt();

        const res = await request(app.getHttpServer())
          .delete(`/employee/${id}`)
          .set('Authorization', auth)
          .expect(200);

        expect(res.body.message).toBe('Employee deleted Successfully');
        await get(id).expect(404);
      });

      it('DELETE /employee/:id answers 404 for an employee that does not exist', async () => {
        await request(app.getHttpServer())
          .delete('/employee/999')
          .set('Authorization', auth)
          .expect(404);

        expect(prismaMock.employee.delete).not.toHaveBeenCalled();
      });
    });
  });

  // ------------------------------------------------------- error handling
  describe('global exception filter', () => {
    let auth: string;

    beforeAll(async () => {
      auth = await bearer(ROLE.Admin);
    });

    it('answers 409 for a Prisma unique-constraint error (P2002)', async () => {
      prismaMock.company.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002' } as any),
      );

      const res = await request(app.getHttpServer())
        .post('/company')
        .set('Authorization', auth)
        .send({ name: 'Acme' })
        .expect(409);

      expect(res.body.message).toBe('A record with the same unique value already exists');
    });

    it('answers 500 for an unexpected error without leaking its message', async () => {
      prismaMock.company.create.mockRejectedValue(new Error('connection to db-prod-01 refused'));

      const res = await request(app.getHttpServer())
        .post('/company')
        .set('Authorization', auth)
        .send({ name: 'Acme' })
        .expect(500);

      expect(res.body).toMatchObject({
        success: false,
        statusCode: 500,
        message: 'Internal server error',
      });
      expect(JSON.stringify(res.body)).not.toContain('db-prod-01');
    });
  });
});