import { Controller, Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get welcome message',
    description: 'Returns the default welcome message to confirm that the API is running.',
  })
  getHello(): string {
    return this.appService.getHello();
  }
  
}
