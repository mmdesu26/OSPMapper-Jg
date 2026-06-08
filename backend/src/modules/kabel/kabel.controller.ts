import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KabelService } from './kabel.service';
@ApiTags('Kabel') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('kabel')
export class KabelController {
  constructor(private svc: KabelService) {}
  @Get()                  findAll(@Query() f: any) { return this.svc.findAll(f); }
  @Get(':id')             findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Get(':id/core')        getCores(@Param('id') id: string) { return this.svc.getCores(id); }
  @Post()                 create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.sub); }
  @Patch(':id')           update(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.svc.update(id, dto, req.user.sub); }
  @Patch(':id/core/:num') updateCore(@Param('id') id: string, @Param('num') num: number, @Body() dto: any, @Request() req: any) { return this.svc.updateCore(id, +num, dto, req.user.sub); }
  @Delete(':id')          @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
