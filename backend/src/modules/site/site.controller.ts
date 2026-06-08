import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SiteService } from './site.service';

@ApiTags('Site')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('site')
export class SiteController {
  constructor(private svc: SiteService) {}
  @Get() findAll(@Query() f: any) { return this.svc.findAll(f); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() dto: any, @Request() req: any) { return this.svc.create(dto, req.user.sub); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: any, @Request() req: any) { return this.svc.update(id, dto, req.user.sub); }
  @Delete(':id') @HttpCode(HttpStatus.NO_CONTENT) remove(@Param('id') id: string) { return this.svc.remove(id); }
}
