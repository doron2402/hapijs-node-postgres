'use strict';

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');

const lab = exports.lab = Lab.script();
let request;
let server;


lab.experiment('Postgres Plugin', () => {

    lab.beforeEach((done) => {

        server = new Hapi.Server();
        server.connection({ port: 0 });
        server.route({
            method: 'GET',
            path: '/',
            handler: (req, reply) => {

                return reply('foo');
            }
        });

        done();
    });

    lab.afterEach((done) => {

        server = null;
        done();
    });

    lab.test('it registers the plugin', (done) => {

        const stub = {
            pg: {
                Pool: class Pool {
                    constructor(options) {

                        Code.expect(options).to.be.an.object();
                    }
                    on(event, cb) {
                        // do something
                        return;
                    }
                }
            }
        };
        const Plugin = Proxyquire('../', stub);

        server.register({
            register: Plugin,
            options: {
                connectionString: 'postgres://postgres:password@localhost:5432/my_app',
                native: false
            }
        }, (err) => {

            Code.expect(err).to.not.exist();
            Code.expect(server.plugins['hapi-node-postgres-7']).to.be.an.object();
            done();
        });
    });


    lab.test('it exposes a query pool function', (done) => {

        const stub = {
            pg: {
                Pool: class Pool {
                    on(event, cb) {
                        // do something
                        return;
                    }
                    query(sqlQuery) {
                        // execute query
                        return;
                    }
                }
            }
        };
        const Plugin = Proxyquire('../', stub);

        server.register({
            register: Plugin,
            options: {
                connectionString: 'postgres://postgres:password@localhost:5432/my_app',
                native: false
            }
        }, (err) => {

            const { pool } = server.plugins['hapi-node-postgres-7'];
            Code.expect(err).to.not.exist();
            Code.expect(pool.query).to.be.a.function();
            done();
        });
    });

    lab.test('it exposes a pool object on request object', (done) => {

        const stub = {
            pg: {
                Pool: class Pool {
                    on(event) {
                        // do something
                        return;
                    }
                    query(sqlQuery) {
                        // execute query
                        return;
                    }
                    connect() {
                        // return client
                        return Promise.resolve({});
                    }
                }
            }
        };
        const Plugin = Proxyquire('../', stub);

        server.register({
            register: Plugin,
            options: {
                connectionString: 'postgres://postgres:password@localhost:5432/my_app',
                native: false
            }
        }, (err) => {

            Code.expect(err).to.not.exist();
            request = { method: 'GET', url: '/' };
            server.inject(request, (response) => {

                Code.expect(response.result).to.be.equal('foo');
                done();
            });
        });
    });

    lab.test('it should call call `release` when detaching', (done) => {

        let isReleased = false;
        const stub = {
            pg: {
                Pool: class Pool {
                    on(event) {
                        // do something
                        return;
                    }
                    query(sqlQuery) {
                        // execute query
                        return;
                    }
                    connect() {
                        // return client
                        const pg = {
                            release: function () {

                                isReleased = true;
                                Code.expect(isReleased).to.equal(true);
                                done();
                            },
                            client: {}
                        };
                        return Promise.resolve(pg);
                    }
                }
            }
        };
        const Plugin = Proxyquire('../', stub);

        server.register({
            register: Plugin,
            options: {
                connectionString: 'postgres://postgres:password@localhost:5432/my_app',
                native: false,
                detach: 'tail'
            }
        }, (err) => {

            Code.expect(err).to.not.exist();
            request = { method: 'GET', url: '/' };
            server.inject(request, (response) => {
                Code.expect(response.result).to.be.equal('foo');
            });
        });
    });

    lab.test('It should support native binding (by default)', (done) => {

        let numberOfNativePoolCalled = 0;
        let numberOfNonNativePoolCalled = 0;
        const stub = {
            pg: {
                native: {
                    Pool: class Pool {
                        constructor(config) {

                            numberOfNativePoolCalled++;
                            Code.expect(config.native).to.be.equal(true);
                            Code.expect(config.connectionString).to.match(/postgres/);
                        }
                        on(event, cb) {

                            return;
                        }
                    }
                },
                Pool: class Pool {
                    constructor() {

                        numberOfNonNativePoolCalled++;
                        return;
                    }
                    on() {

                        return;
                    }
                }
            }
        };
        const Plugin = Proxyquire('../', stub);

        server.register({
            register: Plugin,
            options: {
                connectionString: 'postgres://postgres:password@localhost:5432/my_app',
                detach: 'tail'
            }
        }, (err) => {

            Code.expect(err).to.not.exist();
            Code.expect(numberOfNativePoolCalled).to.be.equal(2);
            Code.expect(numberOfNonNativePoolCalled).to.be.equal(0);
            done();
        });
    });

});
