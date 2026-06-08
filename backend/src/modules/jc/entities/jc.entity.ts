import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Site } from '../../site/entities/site.entity';
@Entity('joint_closure')
export class Jc extends BaseEntity {
  @Column({ unique: true, length: 30 }) kode_jc: string;
  @Column({ length: 20, nullable: true, default: 'dome' }) tipe_jc: string;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) latitude: number;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) longitude: number;
  @Column({ type: 'smallint', default: 0 }) jumlah_core_in: number;
  @Column({ type: 'smallint', default: 0 }) jumlah_core_out: number;
  @Column({ type: 'json', nullable: true }) splice_mapping: object[];
  @Column({ type: 'text', nullable: true }) foto_url: string;
  @Column({ type: 'text', nullable: true }) catatan: string;
  @Column({ type: 'json', nullable: true }) splice_connections: object[];
  @ManyToOne(() => Site, { nullable: true }) @JoinColumn({ name: 'site_id' }) site: Site;
  @Column({ type: 'timestamp', nullable: true }) deleted_at: Date;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'created_by' }) createdBy: User;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy: User;
}
