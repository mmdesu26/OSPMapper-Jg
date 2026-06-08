import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/base.entity';
import { Role } from './role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true, length: 255 }) email: string;
  @Column({ type: 'text' }) @Exclude() password_hash: string;
  @Column({ length: 100 }) full_name: string;
  @Column({ length: 20, nullable: true }) phone: string;
  @Column({ length: 100, nullable: true }) region: string;
  @Column({ default: true }) is_active: boolean;
  @Column({ type: 'timestamp', nullable: true }) last_login_at: Date;
  @Column({ type: 'text', nullable: true }) @Exclude() refresh_token: string;

  @ManyToOne(() => Role, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
