'use strict';
/**
 * This is an example app
 * db: my_app
 * table: users
 *    - id (pk)
 *    - username (string)
 *    'create table "users" (
 *    "username" varchar(255),
 *    "id" serial primary key,
 *    "created_at" timestamptz,
 *    "updated_at" timestamptz);
 *    alter table "users" add constraint "users_username_unique" unique ("username")'
 *
 */

const Hapi = require('hapi');
const Hapi_PG = require('../');
const Joi = require('joi');
const COL_NAME = 'id';
const TABLE_NAME = 'users';

const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

server.route({
    method: 'GET',
    path: '/users',
    config: {
        handler: function (request, reply) {

            const sqlQuery = `select * from ${TABLE_NAME} limit ${request.query.limit}`;
            request.pg.client.query(sqlQuery).then((res) => {

                if (res.rows && res.rows.length > 0) {
                    return reply({ result: res.rows }).code(200);
                }
                return reply('Not Found').code(404);
            }).catch((err) => {

                return reply({ error: err }).code(500);
            });
        },
        validate: {
            query: {
                limit: Joi.number().integer().min(1).max(100).default(10)
            }
        }
    }
});

server.route({
    method: 'GET',
    path: '/users/{id}',
    config: {
        handler: function (request, reply) {

            const sqlQuery = `select * from ${TABLE_NAME} where ${COL_NAME} = ${request.params.id}`;
            request.pg.client.query(sqlQuery).then((res) => {

                if (res.rows && res.rows.length > 0) {
                    return reply({ result: res.rows }).code(200);
                }
                return reply('Not Found').code(404);
            }).catch((err) => {

                return reply({ error: err }).code(500);
            });
        },
        validate: {
            params: {
                id: Joi.number().integer().min(0).required().description('user id (integer) required')
            }
        }
    }
});

server.route({
    method: 'GET',
    path: '/users/username/{username}',
    config: {
        handler: function (request, reply) {

            const sqlQuery = `select * from ${TABLE_NAME} where username = '${request.params.username}'`;
            request.pg.client.query(sqlQuery).then((res) => {

                if (res.rows && res.rows.length > 0) {
                    return reply({ result: res.rows }).code(200);
                }
                return reply('Not Found').code(404);
            }).catch((err) => {

                return reply({ error: err }).code(500);
            });
        },
        validate: {
            params: {
                username: Joi.string().alphanum().lowercase().required().description('username (string) required')
            }
        }
    }
});

server.register({
    register: Hapi_PG,
    options: {
        connectionString: 'postgres://postgres:password@localhost:5432/my_app'
    }
}, (err) => {

    if (err) {

        throw err; // something bad happened loading the plugin
    }
    // Example of using the connection pool without the `request` object
    const { pool } = server.plugins['hapi-node-postgres-7'];
    const sqlQuery = `select ${COL_NAME} from ${TABLE_NAME} limit 10`;
    pool.query(sqlQuery).then((result) => {
        // print the results from the table
        console.log(result.rows);
        server.start((err) => {

            pool.end();
            if (err) {
                throw err;
            }
            server.log('info', 'Server running at: ' + server.info.uri);
        });
    }).catch((e) => {

        throw e;
    });
});
