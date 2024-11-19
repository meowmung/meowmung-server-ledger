import Eureka from 'eureka-js-client';

const client = new Eureka({
    requestMiddleware: (requestOpts, done) => {
        requestOpts.auth = {
            user: 'admin123',
            password: 'admin123'
        };
        done(requestOpts);
    },
    instance: {
        app: 'LEDGER',
        hostName: 'localhost',
        ipAddr: '127.0.0.1',
        statusPageUrl: 'http://localhost:8083/info',
        port: {
            '$': 8083,
            '@enabled': 'true',
        },
        vipAddress: 'jq.test.something.com',
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: {
        host: 'localhost',
        port: 8761,
        servicePath: '/eureka/apps/'
    },
});
export default client;