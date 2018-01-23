'use strict';

const Hoek = require('hoek');
const PG = require('pg');

const DEFAULTS = {
    connectionString: process.env.POSTGRES_URL,
    attach: 'onPreHandler',
    detach: 'tail',
    native: false,
    idleTimeoutMillis: 10000,
    max: 10,
    logToStdout: false
};

exports.register = function (server, options, next) {

    const config = Hoek.applyToDefaults(DEFAULTS, options);
    let Pool = PG.Pool;
    let pool = null;
    if (!!config.native) {
        Pool = PG.native.Pool;
    }
    pool = new Pool(config);

    pool.on('error', (err) => {

        if (!!config.logToStdout) {
            console.error('Unexpected error on idle client', err);
        }
        throw (err);
    });

    // Log on new connection
    pool.on('acquire', () => {

        if (!!config.logToStdout) {
            console.log('PG Pool Acquire new client');
            console.log();
        }
    });

    // Log on connection closed
    pool.on('remove', () => {

        if (!!config.logToStdout) {
            console.log('client is closed & removed from the pool');
        }
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
        // We shouldn't call pool end it will timeout anyway
        // pool.end();
    });

    next();
};


exports.register.attributes = {

    pkg: require('./package.json')
};
