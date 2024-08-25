import Redis from 'ioredis';
import {red} from "next/dist/lib/picocolors";
let redis;
if (process.env.REDIS_PASSWORD){
 redis = new  Redis({
  port: 16874, // Redis port
  host: "redis-16874.c93.us-east-1-3.ec2.redns.redis-cloud.com", // Redis host
  username: "default", // needs Redis >= 6
  password: 'process.env.REDIS_PASSWORD',
 });
} else {
 redis = new Redis({});
}



//const redis = new Redis()
 redis.ping().then(e => console.log(e));

export default redis;
