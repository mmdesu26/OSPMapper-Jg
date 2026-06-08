import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base.entity';
import { Odp } from './odp.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('odp_port')
export class OdpPort extends BaseEntity {
  @ManyToOne(() => Odp, { nullable: false }) @JoinColumn({ name: 'odp_id' }) odp: Odp;
  @Column({ type: 'smallint' }) port_number: number;
  @Column({ type: 'text', nullable: true }) customer_name: string | null;
  @Column({ type: 'timestamp', nullable: true }) deleted_at: Date;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'created_by' }) createdBy: User;
  @ManyToOne(() => User, { nullable: true }) @JoinColumn({ name: 'updated_by' }) updatedBy: User;
}
