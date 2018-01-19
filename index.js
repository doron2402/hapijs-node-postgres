'use strict';

const Hoek = require('hoek');
const PG = require('pg');

const DEFAULTS = {
    connectionString: process.env.POSTGRES_URL,
    attach: 'onPreHandler',
    detach: 'tail',
    native: false,
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

        request.pg = {};
        pool.connect().then((client) => {

            request.pg = client;
            reply.continue();
        }).catch((err) => {

            server.log(['error'], err.stack);
            return reply(err);
        });
    });

    server.on(config.detach, (request, err) => {

        if (request.pg && request.pg.release) {
            request.pg.release();
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
