import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('sites')
export class Site extends BaseEntity {
  @Column({ unique: true, length: 30 }) kode_site: string;
  @Column({ length: 100 }) nama_site: string;
  @Column({ length: 100, nullable: true }) kota: string;
  @Column({ length: 100, nullable: true }) provinsi: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) latitude: number;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) longitude: number;
  @Column({ default: 'aktif' }) status: 'aktif' | 'non_aktif';
  @Column({ type: 'text', nullable: true }) catatan: string;
  @Column({ type: 'timestamp', nullable: true }) deleted_at: Date;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'created_by' }) createdBy: User;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy: User;
}
