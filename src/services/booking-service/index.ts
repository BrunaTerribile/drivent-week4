import { forbiddenError, notFoundError, unauthorizedError } from "@/errors";
import { cannotListHotelsError } from "@/errors/cannot-list-hotels-error";
import bookingRepository from "@/repositories/booking-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketsRepository from "@/repositories/tickets-repository";

async function getBooking(userId: number) {
    const booking = await bookingRepository.getBooking(userId)
    if (!booking) throw notFoundError();

    return booking;
}

async function listHotels(userId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) throw notFoundError();

    const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  
    if (!ticket || ticket.status === 'RESERVED' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
      throw forbiddenError();
    }
}

async function verifyRoom(roomId: number) {
    const room = await bookingRepository.findRoom(roomId)
    if (!room) throw notFoundError;

    const roomBookings = await bookingRepository.checkRoomBookings(roomId)
    if( roomBookings >= room.capacity) throw forbiddenError(); 
}

async function postBooking(userId: number, roomId: number) {
    await listHotels(userId);
    await verifyRoom(roomId);

    const booking = await bookingRepository.postBooking(userId, roomId)
    return booking;
}

async function changeBooking(userId: number, bookingId: number, roomId: number){
    const userBookings = await bookingRepository.getBooking(userId)
    if(!userBookings) throw unauthorizedError();

    await verifyRoom(roomId);

    const booking = await bookingRepository.changeBooking(bookingId, roomId)
    return booking;
}

export default {
    getBooking,
    postBooking,
    changeBooking
};