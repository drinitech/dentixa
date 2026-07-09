import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../lib/asyncHandler";
import { listMyRecalls, dismissRecall } from "../services/recall.service";

export const recallRouter = Router();

recallRouter.use(authenticate, authorize("PATIENT"));

recallRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const recalls = await listMyRecalls(req.user!.id);
    res.json({ recalls });
  }),
);

recallRouter.patch(
  "/:id/dismiss",
  asyncHandler(async (req, res) => {
    const recall = await dismissRecall(req.params.id, req.user!.id);
    res.json({ recall });
  }),
);
