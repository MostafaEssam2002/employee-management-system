// The generated Prisma client is heavy; the filter only needs the error class to do instanceof checks
jest.mock('../../../generated/prisma/client', () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, { code }: { code: string }) {
      super(message);
      this.code = code;
    }
  }
  return { Prisma: { PrismaClientKnownRequestError } };
});
import {
  ArgumentsHost,
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { Prisma } from '../../../generated/prisma/client';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let loggerError: jest.SpyInstance;

  const response = {
    status: jest.fn(),
    json: jest.fn(),
  };
  const request = { method: 'GET', url: '/company/1' };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  const prismaError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('prisma error', { code } as any);

  /** the JSON body the filter sent to the client */
  const sentBody = () => response.json.mock.calls[0][0];

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    // status() must be chainable: response.status(...).json(...)
    response.status.mockReturnValue(response);
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    filter = new HttpExceptionFilter();
  });

  afterEach(() => {
    loggerError.mockRestore();
  });

  // ------------------------------------------------------- response shape
  describe('response shape', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('responds with success=false, statusCode, message, path and timestamp', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00:00.000Z'));

      filter.catch(new NotFoundException('Company not found'), host);

      expect(sentBody()).toEqual({
        success: false,
        statusCode: 404,
        message: 'Company not found',
        path: '/company/1',
        timestamp: '2026-10-08T12:00:00.000Z',
      });
    });

    it('sets the HTTP status of the response to the same statusCode as the body', () => {
      filter.catch(new ForbiddenException('nope'), host);

      expect(response.status).toHaveBeenCalledWith(403);
      expect(sentBody().statusCode).toBe(403);
    });

    it('echoes the url of the request in path', () => {
      const otherHost = {
        switchToHttp: () => ({
          getResponse: () => response,
          getRequest: () => ({ method: 'POST', url: '/department?page=2' }),
        }),
      } as unknown as ArgumentsHost;

      filter.catch(new BadRequestException('bad'), otherHost);

      expect(sentBody().path).toBe('/department?page=2');
    });
  });

  // ------------------------------------------------------- HttpException
  describe('HttpException', () => {
    it('keeps the status of the exception', () => {
      filter.catch(new UnauthorizedException('Invalid credentials'), host);

      expect(sentBody().statusCode).toBe(401);
      expect(sentBody().message).toBe('Invalid credentials');
    });

    it('uses the message of an exception created with a string response', () => {
      filter.catch(new HttpException('Teapot', HttpStatus.I_AM_A_TEAPOT), host);

      expect(sentBody().statusCode).toBe(418);
      expect(sentBody().message).toBe('Teapot');
    });

    it('returns the array of messages produced by ValidationPipe', () => {
      const messages = ['name should not be empty', 'companyId must be a number'];

      filter.catch(new BadRequestException(messages), host);

      expect(sentBody().statusCode).toBe(400);
      expect(sentBody().message).toEqual(messages);
    });

    it('falls back to exception.message when the response object has no message', () => {
      filter.catch(new HttpException({ error: 'Custom' }, HttpStatus.BAD_REQUEST), host);

      expect(sentBody().message).toBe('Http Exception');
    });

    it('does not log 4xx exceptions', () => {
      filter.catch(new NotFoundException('Company not found'), host);
      filter.catch(new BadRequestException('bad'), host);

      expect(loggerError).not.toHaveBeenCalled();
    });

    it('logs 5xx HttpExceptions with the request and the stack', () => {
      const exception = new BadGatewayException('upstream down');

      filter.catch(exception, host);

      expect(sentBody().statusCode).toBe(502);
      expect(loggerError).toHaveBeenCalledWith('GET /company/1 -> 502', exception.stack);
    });
  });

  // ------------------------------------------------------- Prisma errors
  describe('Prisma known request errors', () => {
    it('maps P2002 (unique constraint) to 409 Conflict', () => {
      filter.catch(prismaError('P2002'), host);

      expect(response.status).toHaveBeenCalledWith(409);
      expect(sentBody().statusCode).toBe(409);
      expect(sentBody().message).toBe('A record with the same unique value already exists');
    });

    it('maps P2025 (record not found) to 404 Not Found', () => {
      filter.catch(prismaError('P2025'), host);

      expect(response.status).toHaveBeenCalledWith(404);
      expect(sentBody().statusCode).toBe(404);
      expect(sentBody().message).toBe('Record not found');
    });

    it('does not log the handled Prisma errors', () => {
      filter.catch(prismaError('P2002'), host);
      filter.catch(prismaError('P2025'), host);

      expect(loggerError).not.toHaveBeenCalled();
    });

    it('maps any other Prisma code to 500 without leaking the Prisma message', () => {
      filter.catch(prismaError('P2003'), host);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(sentBody().message).toBe('Internal server error');
      expect(JSON.stringify(sentBody())).not.toContain('prisma error');
    });

    it('logs an unhandled Prisma code as a server error', () => {
      const exception = prismaError('P2003');

      filter.catch(exception, host);

      expect(loggerError).toHaveBeenCalledWith('GET /company/1 -> 500', exception.stack);
    });
  });

  // ------------------------------------------------------ unknown errors
  describe('unknown exceptions', () => {
    it('maps a plain Error to 500 and hides its message from the client', () => {
      filter.catch(new Error('database password is hunter2'), host);

      expect(response.status).toHaveBeenCalledWith(500);
      expect(sentBody().success).toBe(false);
      expect(sentBody().statusCode).toBe(500);
      expect(sentBody().message).toBe('Internal server error');
      expect(JSON.stringify(sentBody())).not.toContain('hunter2');
    });

    it('logs a plain Error with the request and its stack', () => {
      const error = new Error('boom');

      filter.catch(error, host);

      expect(loggerError).toHaveBeenCalledTimes(1);
      expect(loggerError).toHaveBeenCalledWith('GET /company/1 -> 500', error.stack);
    });

    it('handles a thrown string and logs it with String()', () => {
      filter.catch('something bad', host);

      expect(sentBody().statusCode).toBe(500);
      expect(sentBody().message).toBe('Internal server error');
      expect(loggerError).toHaveBeenCalledWith('GET /company/1 -> 500', 'something bad');
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a plain object', { foo: 'bar' }],
    ])('handles %s without throwing', (_label, value) => {
      expect(() => filter.catch(value, host)).not.toThrow();

      expect(sentBody().statusCode).toBe(500);
      expect(sentBody().message).toBe('Internal server error');
    });
  });
});