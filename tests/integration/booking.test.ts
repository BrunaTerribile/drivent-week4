import app, { init } from "@/app";
import supertest from "supertest";
import { cleanDb, generateValidToken } from "../helpers";
import httpStatus from "http-status";
import faker from "@faker-js/faker";
import { createEnrollmentWithAddress, createTicketType, createUser, createTicket, createHotel, createRoomWithHotelId } from "../factories";
import * as jwt from "jsonwebtoken";
import { TicketStatus } from "@prisma/client";
import { createBooking } from "../factories/booking-factory";


beforeAll(async () => {
    await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.get('/booking');
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();
  
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });
  
  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
  
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 when there are no bookings yet', async () => {
      const token = await generateValidToken();
  
      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should respond with status 200 and with user bookings data', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const hotel = await createHotel();
      const room =  await createRoomWithHotelId(hotel.id)
      const booking = await createBooking(user.id, room.id)

      const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
  
      expect(response.status).toEqual(httpStatus.OK);
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: hotel.id,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString(),
        }
      });
    })
  })
})

describe('POST /booking', () => {
  it('should respond with status 401 if no token is given', async () => {
    const response = await server.post('/booking');

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const token = faker.lorem.word();

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 if the user doesnt have enrollment', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 404 if the user doesnt have a ticket', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      await createEnrollmentWithAddress(user);

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 402 if the ticket is not paid', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enroll = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, true);
      await createTicket(enroll.id, ticketType.id, 'RESERVED');

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 402 if the ticket is remote', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enroll = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(true, true);
      await createTicket(enroll.id, ticketType.id, 'PAID');

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 402 if the ticket does not includes hotel', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enroll = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType(false, false);
      await createTicket(enroll.id, ticketType.id, 'PAID');

      const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });
  });

  describe('when token, ticket and enrollment are valid', () => {
    it('should respond with status 403 when room id does not exist', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const hotel = await createHotel();
      const room =  await createRoomWithHotelId(hotel.id)

      const response = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({roomId: 101})

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    })
    
    it('should respond with status 403 when the room have no vacancy', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const hotel = await createHotel();
      const room =  await createRoomWithHotelId(hotel.id)
      await createBooking(user.id, room.id)
      await createBooking(user.id, room.id)
      await createBooking(user.id, room.id)

      const response = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({roomId: room.id})

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    })
    
    
    it('should respond with status 201 and with ticket data', async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const hotel = await createHotel();
      const room =  await createRoomWithHotelId(hotel.id)

      const response = await server
        .post('/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({roomId: room.id})

      expect(response.status).toEqual(httpStatus.CREATED);
      expect(response.body).toEqual({
        bookingId: expect.any(Number)
      });
    })
  })

})