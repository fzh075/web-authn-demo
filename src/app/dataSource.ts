import {DataSource} from 'typeorm';
import {User} from "@/app/entity/user";
import {Credential} from "@/app/entity/credential";

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'root',
  database: 'web_authn_demo',
  entities: [User, Credential],
  synchronize: true,
  logging: true,
});