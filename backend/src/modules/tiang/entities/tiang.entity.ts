import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Site } from '../../site/entities/site.entity';
@Entity('tiang')
export class Tiang extends BaseEntity {
  @Column({ unique: true, length: 30 }) kode_tiang: string;
  @Column({ length: 30, nullable: true }) nomor_tiang: string;
  @Column({ length: 20, nullable: true, default: 'beton' }) jenis_tiang: string;
  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true }) tinggi_meter: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) harga_per_unit: number;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) latitude: number;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) longitude: number;
  @Column({ default: 'baik' }) status: string;
  @Column({ type: 'text', nullable: true }) foto_url: string;
  @Column({ type: 'text', nullable: true }) catatan: string;
  @ManyToOne(() => Site, { nullable: true }) @JoinColumn({ name: 'site_id' }) site: Site;
  @Column({ type: 'timestamp', nullable: true }) deleted_at: Date;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'created_by' }) createdBy: User;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy: User;
}
