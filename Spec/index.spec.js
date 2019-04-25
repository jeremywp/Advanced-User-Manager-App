const request = require('request');

const server = require('../index');

const base_url = 'http://localhost:3000/';

describe('server', () => {
    let data = {};

    afterAll(() => {
    });

    describe('GET /', () => {
        it('returns status code 200', done => {
            request.get(base_url, (error, response, body) => {
                expect(response.statusCode).toBe(200);
                done();
            });
        });
    });

    describe('GET /deleteUser', () => {
        let data = {};
        beforeAll(done => {
            request.post({
                url: `${base_url}deleteUser*`,
                form: {
                    first: 'Jeremy',
                    last: 'Pratt',
                    email: 'dr.jpratt@gmail.com',
                    age: '32'
                }
            },
                (error, response, body) => {
                data.status = response.statusCode;
                done();
            });
        });
        it('returns status code 200', () => {
            expect(data.status).toBe(200);
        });
    });

    describe('GET /userListing', () => {
        let data = {};
        beforeAll(done => {
            request.get(`${base_url}userListing`, (error, response, body) => {
                data.status = response.statusCode;
                data.body = body;
                done();
            });
        });
        it('should show all users', () => {
            expect(data.status).toBe(200);
            expect(data.body).toContain(`<title>User Listing</title>`)
        })
    });

    describe('GET /editUser', () => {
        let data = {};
        let editUser = 'editUser';
        beforeAll(done => {
            request.post({
                url: `${base_url}`,
                form: {
                    first: 'newUserId',
                    last: 'new name',
                    email: 'new email',
                    age: 1
                }
            },
            (error,response,body) => {
                data.status = response.statusCode;
                data.body = body;
                done();
            })
        });
        it('edited the user', done => {
            request.get(`${base_url}${match}`, (error, response, body) => {
                expect(response.statusCode).toBe(200);
                expect(body).toContain('<td>newUserId</td>');
                done();
            });
        });
    });
});