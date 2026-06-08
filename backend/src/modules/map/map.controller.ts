import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MapService } from './map.service';

@ApiTags('Map')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('map')
export class MapController {
  constructor(private svc: MapService) {}

  @Get('assets')
  getAssets() {
    return this.svc.getAllAssets();
  }

  @Get('dashboard')
  getDashboard(@Query('months') months?: string) {
    return this.svc.getDashboardStats(months);
  }
}