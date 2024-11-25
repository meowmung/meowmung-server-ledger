// import Eureka from 'eureka-js-client';
//
// const client = new Eureka({
//     requestMiddleware: (requestOpts, done) => {
//         requestOpts.auth = {
//             user: process.env.EUREKA_USERNAME,
//             password: process.env.EUREKA_PASSWORD,
//         };
//         done(requestOpts);
//     },
//     instance: {
//         app: 'LEDGER',
//         hostName: process.env.HOST,
//         ipAddr: process.env.HOST,
//         statusPageUrl: 'http://localhost:8083/info',
//         port: {
//             '$': process.env.PORT1,
//             '@enabled': 'true',
//         },
//         vipAddress: 'jq.test.something.com',
//         dataCenterInfo: {
//             '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
//             name: 'MyOwn',
//         },
//     },
//     eureka: {
//         host: process.env.EUREKA_HOST,
//         port: process.env.EUREKA_PORT,
//         servicePath: '/eureka/apps/'
//     },
// });
// export default client;