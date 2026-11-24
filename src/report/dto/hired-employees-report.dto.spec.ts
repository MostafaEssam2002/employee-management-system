import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { HiredEmployeesReportDto } from './hired-employees-report.dto';

const check = async (query: Record<string, string>) => {
  const dto = plainToInstance(HiredEmployeesReportDto, query);
  const errors = await validate(dto, { whitelist: true });
  return { dto, invalid: errors.map((e) => e.property) };
};

describe('HiredEmployeesReportDto', () => {
  it('defaults to page 1 and the last 12 months', async () => {
    const { dto, invalid } = await check({});
    expect(invalid).toEqual([]);
    expect(dto).toMatchObject({ page: 1, range: '12m' });
  });

  it('converts query strings to numbers', async () => {
    const { dto, invalid } = await check({ page: '2', companyId: '3', departmentId: '4', range: '6m' });
    expect(invalid).toEqual([]);
    expect(dto).toMatchObject({ page: 2, companyId: 3, departmentId: 4, range: '6m' });
  });

  it('trims the search text and rejects one that is too long', async () => {
    expect((await check({ search: '  ahmed ' })).dto.search).toBe('ahmed');
    expect((await check({ search: 'x'.repeat(101) })).invalid).toContain('search');
  });

  it.each([
    [{ range: 'forever' }, 'range'],
    [{ page: '0' }, 'page'],
    [{ companyId: 'abc' }, 'companyId'],
    [{ departmentId: '-1' }, 'departmentId'],
  ])('rejects %j', async (query, field) => {
    const { invalid } = await check(query);
    expect(invalid).toContain(field);
  });
});
