import httpStatus from 'http-status';
import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '@/middlewares';
import bookingService from '@/services/booking-service';

export async function getBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId } = req;

    try {
        const result = await bookingService.getBooking(Number(userId))
        return res.status(httpStatus.OK).send(result)
    } catch(error) {
        next(error)
    }
}

export async function postBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId } = req;
    const { roomId } = req.body;

    try {
        const result = await bookingService.postBooking(Number(userId), Number(roomId))
        return res.status(httpStatus.OK).send(result)
    } catch(error) {
        next(error)
    }
}

export async function changeBooking(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const { userId } = req;
    const { bookingId } = req.params;
    const { roomId } = req.body;

    try {
        const result = await bookingService.changeBooking(Number(userId), Number(bookingId), Number(roomId))
        return res.status(httpStatus.OK).send(result)
    } catch(error) {
        next(error)
    }
}
