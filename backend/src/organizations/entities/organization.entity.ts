import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Membership } from './membership.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ default: 'free' })
  plan: string;

  @OneToMany(() => Membership, (membership) => membership.organization)
  memberships: Membership[];

  @OneToMany(() => Project, (project) => project.organization)
  projects: Project[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
