import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

// @nestjs/passport ships ESM that Jest cannot load; the guard isn't under test here
jest.mock('@nestjs/passport', () => ({ AuthGuard: () => class {} }));

describe('ReportController', () => {
  let controller: ReportController;
  const reportService = {
    filters: jest.fn().mockResolvedValue({ data: { companies: [] } }),
    hiredEmployees: jest.fn().mockResolvedValue({ data: [] }),
    exportHiredEmployees: jest.fn().mockResolvedValue('csv'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: reportService }],
    }).compile();

    controller = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the query to the service', async () => {
    const query = { page: 1, range: '12m' as const };
    await controller.hiredEmployees(query);
    await controller.exportHiredEmployees(query);
    expect(reportService.hiredEmployees).toHaveBeenCalledWith(query);
    expect(reportService.exportHiredEmployees).toHaveBeenCalledWith(query);
  });
});
