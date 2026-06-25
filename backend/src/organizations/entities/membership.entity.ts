import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from './organization.entity';
import { Role } from '../../common/enums';

@Entity('memberships')
@Unique(['user', 'organization'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Organization, (org) => org.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @Column({ name: 'org_id' })
  orgId: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.VIEWER,
  })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;
}
