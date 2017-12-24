'use strict';

const Hoek = require('hoek');
const PG = require('pg');

const DEFAULTS = {
    connectionString: process.env.POSTGRES_URL,
    attach: 'onPreHandler',
    detach: 'tail',
    native: true,
    idleTimeoutMillis: 10000,
    max: 10
};

exports.register = function (server, options, next) {

    const config = Hoek.applyToDefaults(DEFAULTS, options);
    let Pool = PG.Pool;
    let pool = null;
    if (!!config.native) {
        Pool = PG.native.Pool;
    }
    pool = new Pool(config);

    pool.on('error', (err, client) => {

        console.error('Unexpected error on idle client', err);
        throw (err);
    });

    server.expose('pool', new Pool(config));

    server.ext(config.attach, (request, reply) => {

        pool.connect().then((client) => {

            request.pgClient = client;
            reply.continue();
        }).catch((err) => {

            server.log(['error'], err.stack);
            return reply(err);
        });
    });

    server.on(config.detach, (request, err) => {

        if (request.pgClient && request.pgClient.release) {
            request.pgClient.release();
        }
    });

    process.on('SIGTERM', () => {

        server.log(['warn'], 'Closing postgres pool on SIGTERM');
        pool.end();
    });

    next();
};


exports.register.attributes = {

    pkg: require('./package.json')
};
