import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User } from '../../auth/entities/user.entity';
import { Odc }  from '../../odc/entities/odc.entity';
import { Site } from '../../site/entities/site.entity';
import { OdpPort } from './odp-port.entity';
@Entity('odp')
export class Odp extends BaseEntity {
  @Column({ unique: true, length: 30 }) kode_odp: string;
  @Column({ length: 100 }) nama_odp: string;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) latitude: number;
  @Column({ type: 'decimal', precision: 10, scale: 7 }) longitude: number;
  @Column({ type: 'text', nullable: true }) alamat: string;
  @Column({ type: 'smallint', default: 8 }) kapasitas_port: number;
  @Column({ type: 'smallint', default: 0 }) port_terpakai: number;
  @Column({ default: 'aktif' }) status: string;
  @Column({ type: 'longtext', nullable: true }) foto_url: string;
  @Column({ type: 'text', nullable: true }) catatan: string;
  @Column({ type: 'timestamp', nullable: true }) deleted_at: Date;
  @ManyToOne(() => Site, { nullable: true }) @JoinColumn({ name: 'site_id' }) site: Site;
  @ManyToOne(() => Odc, { nullable: true, eager: false }) @JoinColumn({ name: 'parent_odc_id' }) parentOdc: Odc;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'created_by' }) createdBy: User;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy: User;
  @OneToMany(() => OdpPort, (p) => p.odp) ports: OdpPort[];
}
