import { prisma } from '@/config';

async function getBooking(userId: number) {
  return prisma.booking.findFirst({
    where: { userId },
    select: {
        id: true,
        Room: true,   
    }
  });
}

async function findRoom(id: number) {
    return prisma.room.findFirst({
        where: { id }
    });
}

async function checkRoomBookings(roomId: number) {
    return prisma.booking.count({
        where: { roomId }
    })
}

const bookingRepository = {
    getBooking,
    findRoom,
    checkRoomBookings
};

export default bookingRepository;