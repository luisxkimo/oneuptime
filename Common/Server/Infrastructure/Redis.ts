import {
  RedisDb,
  RedisHostname,
  RedisPassword,
  RedisPort,
  RedisTlsCa,
  RedisTlsCert,
  RedisTlsKey,
  RedisTlsSentinelMode,
  RedisUsername,
  ShouldRedisTlsEnable,
} from "../EnvironmentConfig";
import logger from "../Utils/Logger";
import Sleep from "Common/Types/Sleep";
import { Redis as RedisClient, RedisOptions } from "ioredis";

export type ClientType = RedisClient;
export type RedisOptionsType = RedisOptions;

export default abstract class Redis {
  private static client: RedisClient | null = null;

  public static isConnected(): boolean {
    if (!this.client) {
      return false;
    }

    return this.client.status === "ready";
  }

  public static getClient(): RedisClient | null {
    return this.client;
  }

  public static getRedisOptions(): RedisOptions {
    const redisOptions: RedisOptions = {
      host: RedisHostname,
      port: RedisPort.toNumber(),
      username: RedisUsername,
      password: RedisPassword,
      db: RedisDb,
      enableTLSForSentinelMode: RedisTlsSentinelMode,
      lazyConnect: true,
    };

    if (ShouldRedisTlsEnable) {
      redisOptions.tls = {
        ca: RedisTlsCa || undefined,
        cert: RedisTlsCert || undefined,
        key: RedisTlsKey || undefined,
      };
    }

    return redisOptions;
  }

  public static async connect(): Promise<RedisClient> {
    let retry: number = 0;

    try {
      this.client = new RedisClient(this.getRedisOptions());

      // Listen to 'error' events to the Redis connection
      this.client.on("error", (error: Error) => {
        if ((error as any).code === "ECONNRESET") {
          logger.error("Connection to Redis Session Store timed out.");
        } else if ((error as any).code === "ECONNREFUSED") {
          logger.error("Connection to Redis Session Store refused!");
        } else {
          logger.error(error);
        }
      });

      // Listen to 'reconnecting' event to Redis
      this.client.on("reconnecting", () => {
        if (this.client?.status === "reconnecting") {
          logger.error("Reconnecting to Redis Session Store...");
        } else {
          logger.error("Error reconnecting to Redis Session Store.");
        }
      });

      // Listen to the 'connect' event to Redis
      this.client.on("connect", (err: Error) => {
        if (!err) {
          logger.debug("Connected to Redis Session Store!");
        }
      });

      type ConnectToDatabaseFunction = (client: RedisClient) => Promise<void>;

      const connectToDatabase: ConnectToDatabaseFunction = async (
        client: RedisClient,
      ): Promise<void> => {
        try {
          await client.connect();
        } catch (err) {
          if (retry < 3) {
            logger.debug(
              "Cannot connect to Redis. Retrying again in 5 seconds",
            );
            // sleep for 5 seconds.

            await Sleep.sleep(5000);

            retry++;
            return await connectToDatabase(client);
          }
          throw err;
        }
      };

      await connectToDatabase(this.client);

      logger.debug(
        `Redis connected on ${RedisHostname}:${RedisPort.toNumber()}`,
      );
      return this.client;
    } catch (err) {
      logger.error("Redis Connection Failed");
      logger.error(err);
      throw err;
    }
  }

  public static disconnect(): Promise<void> {
    if (this.isConnected()) {
      this.client?.disconnect();
      this.client = null;
    }

    return Promise.resolve();
  }

  public static async checkConnnectionStatus(): Promise<boolean> {
    // Ping redis to check if the connection is still alive
    try {
      const result: "PONG" | undefined = await this.client?.ping();

      if (result !== "PONG") {
        return false;
      }

      return true;
    } catch (err) {
      logger.error("Redis Connection Lost");
      logger.error(err);
      return false;
    }
  }
}
