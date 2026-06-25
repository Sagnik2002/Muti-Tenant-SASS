import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
