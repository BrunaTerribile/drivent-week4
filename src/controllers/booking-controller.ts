import httpStatus from 'http-status';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';

export async function getBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {}

export async function postBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {}

export async function changeBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {}
