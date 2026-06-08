// odc.controller.ts
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OdcService }   from './odc.service';
import { CreateOdcDto, UpdateOdcDto, FilterOdcDto } from './dto/odc.dto';

@ApiTags('ODC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('odc')
export class OdcController {
  constructor(private svc: OdcService) {}
  @Get()          findAll(@Query() f: FilterOdcDto)                             { return this.svc.findAll(f); }
  @Get('stats')   stats()                                                        { return this.svc.getStats(); }
  @Get(':id')     findOne(@Param('id') id: string)                              { return this.svc.findOne(id); }
  @Post()         create(@Body() dto: CreateOdcDto, @Request() req: any)        { return this.svc.create(dto, req.user.sub); }
  @Patch(':id')   update(@Param('id') id: string, @Body() dto: UpdateOdcDto, @Request() req: any) { return this.svc.update(id, dto, req.user.sub); }
  @Delete(':id')  @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
