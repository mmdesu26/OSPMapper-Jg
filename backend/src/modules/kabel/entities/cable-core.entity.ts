import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { User }   from '../../auth/entities/user.entity';
import { Kabel }  from './kabel.entity';

@Entity('cable_cores')
@Unique(['kabel', 'core_number'])
export class CableCore extends BaseEntity {
  @ManyToOne(() => Kabel, (k) => k.cores, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'kabel_id' }) kabel: Kabel;
  @Column({ type: 'smallint' }) core_number: number;
  @Column({ length: 20, nullable: true }) warna_tube: string;
  @Column({ length: 20, nullable: true }) warna_core: string;
  @Column({ default: 'spare' }) status: 'used' | 'spare' | 'broken' | 'reserved';
  @Column({ length: 50, nullable: true }) service_ref: string;
  @Column({ type: 'text', nullable: true }) catatan: string;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy: User;
}
