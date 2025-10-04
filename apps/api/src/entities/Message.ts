import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "messages" })
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  sender!: string;

  @Column({ type: "varchar", length: 100 })
  receiver!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ type: "varchar", length: 100 })
  txSignature!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  tokenAddress?: string | null;

  @Column({ type: "decimal", precision: 20, scale: 9, default: 0 })
  feePaid!: number;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;
}
