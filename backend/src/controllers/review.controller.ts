import type { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as reviewService from "../services/review.service";

export const createReviewHandler = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.createReview(req.params.id, req.user!.id, req.body);
  res.status(201).json({ review });
});

export const listDoctorReviewsHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await reviewService.listDoctorReviews(req.params.id);
  res.json(result);
});
