import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Odp } from './entities/odp.entity';
import { OdpPort } from './entities/odp-port.entity';
import { Odc } from '../odc/entities/odc.entity';

@Injectable()
export class OdpService {
  constructor(
    @InjectRepository(Odp) private repo: Repository<Odp>,
    @InjectRepository(OdpPort) private portRepo: Repository<OdpPort>,
    @InjectRepository(Odc) private odcRepo: Repository<Odc>,
  ) {}

  async findAll(f: any) {
    const where: any = { deleted_at: IsNull() };
    if (f.status) where.status = f.status;
    if (f.parent_odc_id) where.parentOdc = { id: f.parent_odc_id };
    if (f.site_id) where.site = { id: f.site_id };
    const page = Number(f.page || 1);
    const limit = Number(f.limit || 20);
    const [data, total] = await this.repo.findAndCount({
      where: f.q ? [{ ...where, kode_odp: Like(`%${f.q}%`) }, { ...where, nama_odp: Like(`%${f.q}%`) }] : where,
      relations: ['parentOdc', 'site', 'ports'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 } };
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id, deleted_at: IsNull() }, relations: ['parentOdc', 'site', 'ports'] });
    if (!item) throw new NotFoundException('ODP tidak ditemukan');
    return item;
  }

  async create(dto: any, userId: string) {
    const exists = await this.repo.findOne({ where: { kode_odp: dto.kode_odp } });
    if (exists) throw new ConflictException(`Kode ${dto.kode_odp} sudah ada`);
    const { parent_odc_id, site_id, pelanggan_list, ...rest } = dto;
    const entity = this.repo.create({
    ...rest,
    parentOdc: parent_odc_id ? ({ id: parent_odc_id } as any) : null,
    site: site_id ? ({ id: site_id } as any) : null,
    createdBy: { id: userId } as any,
    updatedBy: { id: userId } as any,
  } as Partial<Odp>) as Odp;

  const saved = await this.repo.save(entity);

  await this.syncPorts(
    saved,
    (pelanggan_list || '').split('\n').map((s: string) => s.trim()),
    userId,
  );
    if (parent_odc_id) await this.recalculateOdcUsage(parent_odc_id);
    return saved;
  }

  async update(id: string, dto: any, userId: string) {
    const item = await this.findOne(id);
    const previousOdcId = item.parentOdc?.id;
    const { parent_odc_id, site_id, pelanggan_list, ...rest } = dto;
    Object.assign(item, rest, { updatedBy: { id: userId } });
    if (parent_odc_id !== undefined) item.parentOdc = parent_odc_id ? { id: parent_odc_id } as any : null as any;
    if (site_id !== undefined) item.site = site_id ? { id: site_id } as any : null as any;
    if (item.port_terpakai >= item.kapasitas_port) item.status = 'penuh';
    const saved = await this.repo.save(item);
    await this.syncPorts(saved, (pelanggan_list || '').split('\n').map((s: string) => s.trim()), userId);
    if (previousOdcId && previousOdcId !== parent_odc_id) await this.recalculateOdcUsage(previousOdcId);
    if (parent_odc_id) await this.recalculateOdcUsage(parent_odc_id);
    return saved;
  }

  private async syncPorts(odp: Odp, pelanggan: string[], userId: string) {
    await this.portRepo.createQueryBuilder().delete().where('odp_id = :id', { id: odp.id }).execute();
    const toInsert: Partial<OdpPort>[] = [];
    for (let i = 1; i <= (odp.kapasitas_port || 0); i++) {
      const name = pelanggan[i - 1] || null;
      toInsert.push({ odp: { id: odp.id } as any, port_number: i, customer_name: name, createdBy: { id: userId } as any, updatedBy: { id: userId } as any });
    }
    if (toInsert.length) await this.portRepo.save(this.portRepo.create(toInsert as any));
    const used = pelanggan.filter(Boolean).length;
    await this.repo.update(odp.id, { port_terpakai: used });
  }

  async remove(id: string) {
    const item = await this.findOne(id);
    const odcId = item.parentOdc?.id;
    await this.repo.update(id, { deleted_at: new Date() });
    if (odcId) await this.recalculateOdcUsage(odcId);
  }

  async getStats() {
    const total = await this.repo.count({ where: { deleted_at: IsNull() } });
    const penuh = await this.repo.count({ where: { status: 'penuh', deleted_at: IsNull() } });
    const kritis = await this.repo.count({ where: { status: 'kritis', deleted_at: IsNull() } });
    return { total, penuh, kritis };
  }

  private async recalculateOdcUsage(odcId: string) {
    const count = await this.repo.count({ where: { parentOdc: { id: odcId }, deleted_at: IsNull() } });
    const odc = await this.odcRepo.findOne({ where: { id: odcId } });
    if (odc) {
      odc.port_terpakai = count;
      if (odc.status === 'aktif' && count >= odc.kapasitas_port) odc.status = 'penuh';
      else if (odc.status === 'penuh' && count < odc.kapasitas_port) odc.status = 'aktif';
      await this.odcRepo.save(odc);
    }
  }
}
