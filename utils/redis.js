const { createClient } = require("redis")

// {
//     socket: {
//         host: process.env.REDIS_HOST,
//             port: process.env.REDIS_PORT
//     },
//     username: process.env.REDIS_USERNAME,
//         password: process.env.REDIS_PASSWORD
// }
class redisUtil {
    constructor() {
        this.client = createClient()

        this.client.on("connect", (err) => {
            console.log("Client connected to Redis...");
        });

        this.client.connect();
    }
    setToken(key, value = "1", expiry = 60 * 60 * 24) {
        //console.log(key, value, expiry)
        return new Promise(async (resolve) => {
            // EX means expiry time in seconds. can also use PX for ms.
            const data = await this.client.set(key, value, { EX: expiry })
            resolve(data)
        })
    }
    getToken(token) {
        return new Promise(async (resolve) => {
            const data = await this.client.get(token);
            resolve(data);
        });
    }

    deleteToken(token) {
        return new Promise(async (resolve) => {
            const data = await this.client.del(token);
            resolve(data);
        });
    }
    tokenExists(token) {
        return new Promise(async (resolve) => {
            const data = await this.client.EXISTS(token);
            resolve(data);
        });
    }
}

module.exports = new redisUtil()