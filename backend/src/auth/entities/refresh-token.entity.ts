import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { createHash } from "crypto";
import { User } from "../../users/entities/user.entity";

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: string;

  @Column()
  tokenHash: string;

  /** SHA-256 hex of the raw token — used for O(1) DB lookup before bcrypt verify */
  @Index()
  @Column({ nullable: true })
  tokenLookup: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  static computeLookup(tokenValue: string): string {
    return createHash("sha256").update(tokenValue).digest("hex");
  }
}
