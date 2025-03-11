import {BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation} from "typeorm";
import {Credential} from "@/app/entity/credential";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  // @OneToMany(() => import('./credential').then((m) => m.Credential, (credential) => credential.user))
  // credentials: import('./credential').Credential[];

  @OneToMany(() => Credential, (credential) => credential.user)
  credentials: Relation<Credential[]>;
}