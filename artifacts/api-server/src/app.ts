import express, { type Express, type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { sameOrigin } from "./lib/session";

const app: Express = express();
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(sameOrigin);

app.use("/api", router);
const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  req.log.error({ err }, "API request failed");
  const badJson = err instanceof SyntaxError;
  res.status(badJson ? 400 : 500).json({ error: badJson ? "Request JSON is invalid." : "Something went wrong. Please try again." });
};
app.use(errorHandler);

export default app;
