import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation} from "typeorm";
import {User} from "@/app/entity/user";
import {AuthenticatorTransportFuture} from "@simplewebauthn/server";

@Entity()
export class Credential extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  credentialId: string;

  @Column('text')
  publicKey: string;

  @Column()
  counter: number;

  @Column({type: 'simple-array', nullable: true})
  transports: AuthenticatorTransportFuture[];

  @ManyToOne(() => User, (user) => user.credentials)
  user: Relation<User>;
}