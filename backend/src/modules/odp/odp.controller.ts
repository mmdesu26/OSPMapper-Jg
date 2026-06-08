import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OdpService } from './odp.service';
@ApiTags('ODP') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('odp')
export class OdpController {
  constructor(private svc: OdpService) {}
  @Get()          findAll(@Query() f: any) { return this.svc.findAll(f); }
  @Get('stats')   stats()                  { return this.svc.getStats(); }
  @Get(':id')     findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post()         create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.sub); }
  @Patch(':id')   update(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.svc.update(id, dto, req.user.sub); }
  @Delete(':id')  @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
