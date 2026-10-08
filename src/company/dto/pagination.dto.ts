import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
    @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page = 1;
}