import { Router } from "express";
import { authRouter } from "./auth.routes";
import { appointmentRouter } from "./appointment.routes";
import { scheduleRouter } from "./schedule.routes";
import { serviceRouter } from "./service.routes";
import { userRouter } from "./user.routes";
import { doctorRouter } from "./doctor.routes";
import { adminRouter } from "./admin.routes";
import { waitlistRouter } from "./waitlist.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/appointments", appointmentRouter);
router.use("/schedule", scheduleRouter);
router.use("/services", serviceRouter);
router.use("/users", userRouter);
router.use("/doctors", doctorRouter);
router.use("/admin", adminRouter);
router.use("/waitlist", waitlistRouter);
