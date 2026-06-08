import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 30 }) name: string;
  @Column({ length: 60, nullable: true }) label: string;
  @Column({ type: 'json', nullable: true }) permissions: Record<string, any>;
  @Column({ type: 'timestamp', default: () => 'NOW()' }) created_at: Date;
}
