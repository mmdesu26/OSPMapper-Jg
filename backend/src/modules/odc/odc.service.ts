import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Odc } from './entities/odc.entity';
import { CreateOdcDto, UpdateOdcDto, FilterOdcDto } from './dto/odc.dto';

@Injectable()
export class OdcService {
  constructor(@InjectRepository(Odc) private repo: Repository<Odc>) {}

  async findAll(f: FilterOdcDto & any) {
    const where: any = { deleted_at: IsNull() };
    if (f.status) where.status = f.status;
    if (f.site_id) where.site = { id: f.site_id };
    const page = Number(f.page || 1);
    const limit = Number(f.limit || 20);
    const [data, total] = await this.repo.findAndCount({
      where: f.q ? [{ ...where, kode_odc: Like(`%${f.q}%`) }, { ...where, nama_odc: Like(`%${f.q}%`) }] : where,
      relations: ['site'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 } };
  }

  async findOne(id: string): Promise<Odc> {
    const odc = await this.repo.findOne({ where: { id, deleted_at: IsNull() }, relations: ['site'] });
    if (!odc) throw new NotFoundException(`ODC ${id} tidak ditemukan`);
    return odc;
  }

  async create(dto: CreateOdcDto & any, userId: string): Promise<Odc> {
    const exists = await this.repo.findOne({ where: { kode_odc: dto.kode_odc } });
    if (exists) throw new ConflictException(`Kode ${dto.kode_odc} sudah ada`);
    const { site_id, ...rest } = dto;
    const odc = this.repo.create({
      ...rest,
      site: site_id ? { id: site_id } as any : null,
      createdBy: { id: userId } as any,
      updatedBy: { id: userId } as any,
    } as any);
    return this.repo.save(odc as unknown as Odc);
  }

  async update(id: string, dto: UpdateOdcDto & any, userId: string): Promise<Odc> {
    const odc = await this.findOne(id);
    const { site_id, ...rest } = dto;
    Object.assign(odc, rest, { updatedBy: { id: userId } });
    if (site_id !== undefined) odc.site = site_id ? { id: site_id } as any : null as any;
    if (odc.port_terpakai >= odc.kapasitas_port) odc.status = 'penuh';
    return this.repo.save(odc);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.repo.update(id, { deleted_at: new Date() });
  }

  async getStats() {
    const total = await this.repo.count({ where: { deleted_at: IsNull() } });
    const aktif = await this.repo.count({ where: { status: 'aktif', deleted_at: IsNull() } });
    const penuh = await this.repo.count({ where: { status: 'penuh', deleted_at: IsNull() } });
    const maint = await this.repo.count({ where: { status: 'maintenance', deleted_at: IsNull() } });
    return { total, aktif, penuh, maintenance: maint };
  }
}
