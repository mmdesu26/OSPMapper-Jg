import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Kabel } from './entities/kabel.entity';
import { CableCore } from './entities/cable-core.entity';

@Injectable()
export class KabelService {
  constructor(
    @InjectRepository(Kabel) private repo: Repository<Kabel>,
    @InjectRepository(CableCore) private coreRepo: Repository<CableCore>,
  ) {}

  async findAll(f: any) {
    const where: any = { deleted_at: IsNull() };
    if (f.status) where.status = f.status;
    if (f.site_id) where.site = { id: f.site_id };
    const page = Number(f.page || 1);
    const limit = Number(f.limit || 20);
    const [data, total] = await this.repo.findAndCount({
      where: f.q ? [{ ...where, kode_kabel: Like(`%${f.q}%`) }, { ...where, nama_kabel: Like(`%${f.q}%`) }] : where,
      relations: ['site'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 } };
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id, deleted_at: IsNull() }, relations: ['site'] });
    if (!item) throw new NotFoundException('Kabel tidak ditemukan');
    return item;
  }

  async create(dto: any, userId: string) {
    const exists = await this.repo.findOne({ where: { kode_kabel: dto.kode_kabel } });
    if (exists) throw new ConflictException(`Kode ${dto.kode_kabel} sudah ada`);
    const { site_id, ...rest } = dto;
    const savedKabel = await this.repo.save(this.repo.create({
      ...rest,
      site: site_id ? { id: site_id } as any : null,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    } as any));
    const kabel = Array.isArray(savedKabel) ? savedKabel[0] : savedKabel;

    const cores = Array.from({ length: Number(dto.jumlah_core || 0) }, (_, i) => {
      const core = this.coreRepo.create({ core_number: i + 1, status: 'spare' });
      core.kabel = kabel as Kabel;
      return core;
    });
    if (cores.length) await this.coreRepo.save(cores);
    return kabel;
  }

  async update(id: string, dto: any, userId: string) {
    const item = await this.findOne(id);
    const { site_id, ...rest } = dto;
    Object.assign(item, rest, { updatedBy: { id: userId } });
    if (site_id !== undefined) item.site = site_id ? { id: site_id } as any : null as any;
    const used = await this.coreRepo.count({ where: { kabel: { id }, status: 'used' } });
    item.core_terpakai = used;
    if (item.jumlah_core && used / item.jumlah_core >= 0.9) item.status = 'kritis';
    return this.repo.save(item);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { deleted_at: new Date() });
  }

  async getCores(kabelId: string) {
    await this.findOne(kabelId);
    return this.coreRepo.find({ where: { kabel: { id: kabelId } }, order: { core_number: 'ASC' } });
  }

  async updateCore(kabelId: string, coreNum: number, dto: any, userId: string) {
    const core = await this.coreRepo.findOne({ where: { kabel: { id: kabelId }, core_number: coreNum } });
    if (!core) throw new NotFoundException(`Core ${coreNum} tidak ditemukan`);
    Object.assign(core, dto, { updatedBy: { id: userId } });
    await this.coreRepo.save(core);
    const used = await this.coreRepo.count({ where: { kabel: { id: kabelId }, status: 'used' } });
    await this.repo.update(kabelId, { core_terpakai: used });
    return core;
  }
}
