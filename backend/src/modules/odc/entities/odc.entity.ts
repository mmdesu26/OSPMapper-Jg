// entities/odc.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User }       from '../../auth/entities/user.entity';
import { Site }       from '../../site/entities/site.entity';

@Entity('odc')
export class Odc extends BaseEntity {
  @Column({ unique: true, length: 30 })   kode_odc: string;
  @Column({ length: 100 })                nama_odc: string;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) latitude: number;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) longitude: number;
  @Column({ type: 'text', nullable: true })  alamat: string;
  @Column({ type: 'smallint', default: 16 }) kapasitas_port: number;
  @Column({ type: 'smallint', default: 0 })  port_terpakai: number;
  @Column({ default: '1:8', nullable: true }) jenis_splitter: string;
  @Column({ default: 'aktif' })
  status: 'aktif' | 'penuh' | 'maintenance' | 'non_aktif';
  @Column({ type: 'longtext', nullable: true }) foto_url: string;
  @Column({ type: 'text', nullable: true }) catatan: string;
  @ManyToOne(() => Site, { nullable: true }) @JoinColumn({ name: 'site_id' }) site: Site;
  @Column({ type: 'timestamp', nullable: true }) deleted_at: Date;

  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'created_by' }) createdBy: User;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy: User;
}
