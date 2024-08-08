import Redis from 'ioredis';

// const redis = new  Redis({
//     port: 16874, // Redis port
//     host: "redis-16874.c93.us-east-1-3.ec2.redns.redis-cloud.com", // Redis host
//     username: "default", // needs Redis >= 6
//     password: 'XV8hqWunqnLEBOPXKJ15nwt63zGVd301',
// });
const redis  = new Redis({})


//const redis = new Redis()
 redis.ping().then(e => console.log(e));

export default redis;
