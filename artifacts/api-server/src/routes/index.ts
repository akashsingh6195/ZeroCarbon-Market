import { Router, type IRouter } from "express";
import healthRouter from "./health";
import identityRouter from "./identity";
import marketRouter from "./market";
import ordersRouter from "./orders";
import assistantRouter from "./assistant";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(identityRouter);
router.use(marketRouter);
router.use(ordersRouter);
router.use(assistantRouter);
router.use(adminRouter);

export default router;
