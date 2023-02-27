import Knex from 'knex';
import databaseConfig from '../config/database';

export default Knex(databaseConfig);