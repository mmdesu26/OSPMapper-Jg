import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../auth/entities/user.entity';
import { CableCore } from './cable-core.entity';
import { Site } from '../../site/entities/site.entity';

@Entity('kabel')
export class Kabel extends BaseEntity {
  @Column({ unique: true, length: 30 }) kode_kabel: string;
  @Column({ length: 100 }) nama_kabel: string;
  @Column({ length: 50, nullable: true }) jenis_kabel: string;
  @Column({ type: 'smallint' }) jumlah_core: number;
  @Column({ type: 'smallint', default: 0 }) core_terpakai: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true }) panjang_meter: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) harga_per_meter: number;
  @Column({ length: 10, nullable: true }) source_type: string;
  @Column({ nullable: true }) source_id: string;
  @Column({ length: 10, nullable: true }) dest_type: string;
  @Column({ nullable: true }) dest_id: string;
  @Column({ default: 'aktif' }) status: string;
  @Column({ length: 20, nullable: true, default: '#7C3AED' }) warna_kabel: string;
  @Column({ type: 'json', nullable: true }) route_points: object[];
  @Column({ type: 'text', nullable: true }) catatan: string;
  @ManyToOne(() => Site, { nullable: true }) @JoinColumn({ name: 'site_id' }) site: Site;
  @Column({ type: 'timestamp', nullable: true }) deleted_at: Date;
  @OneToMany(() => CableCore, (c) => c.kabel, { cascade: true }) cores: CableCore[];
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'created_by' }) createdBy: User;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy: User;
}
