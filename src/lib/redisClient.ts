import { Redis } from 'ioredis';

let redis:Redis;
if (process.env.REDIS_PASSWORD){
 redis = new  Redis({
  port: 12036, // Redis port
  host: "redis-12036.crce206.ap-south-1-1.ec2.redns.redis-cloud.com", // Redis host
  username: "default", // needs Redis >= 6
  password: process.env.REDIS_PASSWORD,
 });
} else {
 redis = new Redis({});
}



//const redis = new Redis()
 redis.ping().then(e => console.log(e));

export default redis;



