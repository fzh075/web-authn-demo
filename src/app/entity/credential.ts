import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation} from "typeorm";
import {User} from "@/app/entity/user";

@Entity()
export class Credential extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text') // ? 'text'
  publicKey: string;

  @Column()
  counter: number;

  @Column()
  transports: string;

  @ManyToOne(() => User, (user) => user.credentials)
  user: Relation<User>;
}