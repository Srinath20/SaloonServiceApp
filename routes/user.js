require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const users = express.Router();
users.use(cookieParser());
users.use(express.json());
const models = require("../db/models");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Sib = require('sib-api-v3-sdk');
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.API_KEY;

//Sign Up API -done
users.post("/signUp", async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await models.users.create({
      name: name,
      email: email,
      password: hashedPassword,
      mobile: mobile,
      role: "customer",
    });

    res.status(200).json({ message: "Sign Up successful" });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      res.status(400).json({ message: "Email already exists" });
    } else {
      res.status(500).json({ message: "Failed to sign up user" });
    }
  }
});

// Login API - done
users.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await models.users.findOne({ where: { email: email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1w" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    console.log(token);
    res.status(200).json({ message: "Login successful", token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Failed to Log In" });
  }
});

// Admin addition service API - done
users.post("/createService", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admins only" });
      }
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { name, description, price, hours } = req.body;
    const result = await models.services.create({
      name: name,
      description: description,
      price: price,
      hours: hours,
    });
    res.status(200).json({ message: "Added Service Successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create service" });
  }
});

// Get all services API - done
users.get("/getAllServices", async (req, res) => {
  try {
    const { date, search } = req.query;
    let services;
    if (search) {
      services = await models.services.findAll({
        where: {
          name: {
            [Op.iLike]: `%${search}%`,
          },
        },
      });
    } else {
      services = await models.services.findAll();
    }

    if (date) {
      const servicesInRange = services.filter((service) => {
        const fromDate = new Date(service.fromDate);
        const toDate = new Date(service.toDate);
        const queryDate = new Date(date);
        return queryDate >= fromDate && queryDate <= toDate;
      });

      return res.status(200).json(servicesInRange);
    }

    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch services" });
  }
});

// Make Staff API - done
users.post("/makeStaff", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admins only" });
      }
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { userId } = req.body;
    const user = await models.users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await models.users.update(
      { role: "staff" },
      {
        where: {
          id: userId,
        },
      }
    );

    res.status(200).json({ message: "User role updated to staff" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user role" });
  }
});

// Edit Profile -done
users.put("/editProfile", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data, id } = req.body;

    let userId = decoded.id;
    if (decoded.role === "admin" && id) {
      userId = id;
    }

    await models.users.update(data, {
      where: {
        id: userId,
      },
    });

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// assign service to staff - done
users.post("/assignService", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admins only" });
      }
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { userId, serviceId } = req.body;
    const user = await models.users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "staff") {
      return res.status(400).json({ message: "User is not a staff member" });
    }

    const service = await models.services.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    await models.staffservices.create({
      staffId: userId,
      serviceId: serviceId,
    });

    res.status(200).json({ message: "Service assigned to staff successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to assign service" });
  }
});

// book service for user - done
users.post("/bookService", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { bookingFromDate, serviceId, staffId } = req.body;

    const user = await models.users.findByPk(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const service = await models.services.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const staff = await models.users.findByPk(staffId);
    if (!staff || staff.role !== "staff") {
      return res.status(400).json({ message: "Invalid staff member" });
    }

    const serviceHours = service.hours;
    const bookingToDate = new Date(bookingFromDate);
    bookingToDate.setHours(bookingToDate.getHours() + serviceHours);

    const conflictingBooking = await models.userBookings.findOne({
      where: {
        staffId: staffId,
        [Op.or]: [
          { bookingFromDate: { [Op.between]: [bookingFromDate, bookingToDate] } },
          { bookingToDate: { [Op.between]: [bookingFromDate, bookingToDate] } },
        ],
      },
    });

    if (conflictingBooking) {
      return res.status(400).json({ message: "Staff is unavailable during the selected time" });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: { currency: "INR", product_data: { name: service.name }, unit_amount: service.price * 100 },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `http://localhost:3000/api/verifyPayment?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "http://localhost:3000/cancel",
      metadata: { userId: decoded.id, serviceId, staffId, bookingFromDate },
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe session creation error:", err);
    res.status(500).json({ message: "Failed to create Stripe session" });
  }
});

users.get("/verifyPayment", async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).send("<h2>Session ID is required to verify payment.</h2>");
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("Retrieved Stripe session:", session);

    if (session.payment_status === "paid") {
      const { userId, serviceId, staffId, bookingFromDate } = session.metadata;

      const service = await models.services.findByPk(serviceId);
      if (!service) {
        return res.status(404).send("<h2>Service not found.</h2>");
      }

      const bookingToDate = new Date(bookingFromDate);
      bookingToDate.setHours(bookingToDate.getHours() + service.hours);

      const booking = await models.userBookings.create({
        userId,
        serviceId,
        staffId,
        bookingFromDate,
        bookingToDate,
      });

      console.log("Booking created successfully:", booking);

      const user = await models.users.findByPk(userId);
      if (user && user.email) {
        const sender = {
          email: 'javagalsrinath.619@gmail.com',
          name: 'Srinath'
        };
        const receiver = [{
          email: user.email,
          name: user.name || "Customer"
        }];

        const tranEmailApi = new Sib.TransactionalEmailsApi();

        tranEmailApi.sendTransacEmail({
          sender,
          to: receiver,
          subject: "Booking Confirmation - Gentle Reminder",
          textContent: `
            Dear ${user.name || "Customer"},
            
            This is a gentle reminder for your upcoming appointment. Here are your booking details:
            
            Service: ${service.name}
            Staff Assigned: ${staffId}
            Start Time: ${bookingFromDate}
            End Time: ${bookingToDate}
            
            Thank you for booking with us! We look forward to serving you.

            Best regards,
            Srinath
          `,
          htmlContent: `
            <h3>Booking Confirmation - Gentle Reminder</h3>
            <p>Dear ${user.name || "Customer"},</p>
            <p>This is a gentle reminder for your upcoming appointment. Here are your booking details:</p>
            <ul>
              <li><strong>Service:</strong> ${service.name}</li>
              <li><strong>Staff Assigned:</strong> ${staffId}</li>
              <li><strong>Start Time:</strong> ${bookingFromDate}</li>
              <li><strong>End Time:</strong> ${bookingToDate}</li>
            </ul>
            <p>Thank you for booking with us! We look forward to serving you.</p>
            <p>Best regards,<br>Srinath</p>
          `
        })
          .then(() => {
            console.log("Email sent successfully to:", user.email);
          })
          .catch((error) => {
            console.error("Error sending email:", error);
          });
      }

      // Respond with a success message
      return res.status(200).send(`
        <h2>Booking confirmed successfully!</h2>
        <p>Booking Details:</p>
        <ul>
          <li>Service: ${service.name}</li>
          <li>Start: ${bookingFromDate}</li>
          <li>End: ${bookingToDate}</li>
        </ul>
      `);
    } else {
      console.error("Payment not successful, status:", session.payment_status);
      return res.status(400).send("<h2>Payment not successful.</h2>");
    }
  } catch (err) {
    console.error("Error verifying payment:", err.message);
    res.status(500).send("<h2>Failed to verify payment.</h2>");
  }
});

// user feedback - done
users.post("/createReview", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { bookingId, review, rating } = req.body;

    const booking = await models.userBookings.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId !== decoded.id) {
      return res.status(403).json({
        message: "Forbidden: You can only review your own userBookings",
      });
    }

    const newReview = await models.reviews.create({
      bookingId: bookingId,
      review: review,
      rating: rating,
    });

    res.status(200).json({ message: "Review created successfully", newReview });
  } catch (err) {
    res.status(500).json({ message: "Failed to create review" });
  }
});

// Staff response to user feedback  - done
users.put("/updateReviewResponse", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "staff") {
      return res.status(403).json({ message: "Forbidden: Staff only" });
    }

    const { bookingId, staffResponse } = req.body;

    const booking = await models.userBookings.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.staffId !== decoded.id) {
      return res.status(403).json({
        message: "Forbidden: You can only respond to your own userBookings",
      });
    }

    const review = await models.reviews.findOne({
      where: { bookingId: bookingId },
    });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await models.reviews.update(
      { staffResponse: staffResponse },
      { where: { bookingId: bookingId } }
    );

    res.status(200).json({ message: "Staff response updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update staff response" });
  }
});

// reschedule booking
users.put("/rescheduleBooking", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { bookingId, newFromDate, newStaffId } = req.body;

    const booking = await models.userBookings.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId !== decoded.id && decoded.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: You can only reschedule your own userBookings",
      });
    }

    const service = await models.services.findByPk(booking.serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    const newToDate = new Date(newFromDate);
    newToDate.setHours(newToDate.getHours() + service.hours);

    const staff = await models.users.findByPk(newStaffId);
    if (!staff || staff.role !== "staff") {
      return res.status(400).json({ message: "Invalid staff member" });
    }

    const conflictingService = await models.services.findOne({
      where: {
        id: booking.serviceId,
        [Op.or]: [
          {
            fromDate: {
              [Op.between]: [newFromDate, newToDate],
            },
          },
          {
            toDate: {
              [Op.between]: [newFromDate, newToDate],
            },
          },
        ],
      },
    });

    if (conflictingService) {
      return res
        .status(400)
        .json({ message: "Service is unavailable during the selected dates" });
    }

    const conflictingBooking = await models.userBookings.findOne({
      where: {
        staffId: newStaffId,
        [Op.or]: [
          {
            bookingFromDate: {
              [Op.between]: [newFromDate, newToDate],
            },
          },
          {
            bookingToDate: {
              [Op.between]: [newFromDate, newToDate],
            },
          },
        ],
      },
    });

    if (conflictingBooking) {
      return res
        .status(400)
        .json({ message: "Staff is unavailable during the selected dates" });
    }

    await models.userBookings.update(
      {
        bookingFromDate: newFromDate,
        bookingToDate: newToDate,
        staffId: newStaffId,
      },
      {
        where: {
          id: bookingId,
        },
      }
    );

    res.status(200).json({ message: "Booking rescheduled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reschedule booking" });
  }
});

//Get Booking details API
users.get("/bookingDetails/:bookingId", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { bookingId } = req.params;

    const booking = await models.userBookings.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId !== decoded.id && decoded.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: You can only view your own userBookings",
      });
    }

    res.status(200).json({ booking });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch booking details" });
  }
});

users.delete("/cancelBooking/:bookingId", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { bookingId } = req.params;

    const booking = await models.userBookings.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.userId !== decoded.id && decoded.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: You can only cancel your own userBookings",
      });
    }

    const bookingFromDate = new Date(booking.bookingFromDate);
    const currentDate = new Date();
    const timeDifference = bookingFromDate - currentDate;
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    if (hoursDifference < 24 && decoded.role !== "admin") {
      return res.status(400).json({
        message: "Cannot cancel booking within 24 hours of the booking date",
      });
    }

    await models.userBookings.destroy({
      where: {
        id: bookingId,
      },
    });

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

users.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logout successful" });
});

users.get("/profile/:userId", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = req.params;

    if (decoded.role !== "admin" && decoded.id !== parseInt(userId, 10)) {
      return res.status(403).json({ message: "Forbidden: Access denied" });
    }

    const user = await models.users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// delete user api
users.delete("/deleteUser/:userId", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = req.params;

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const user = await models.users.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "staff") {
      const currentDate = new Date();
      const upcominguserBookings = await models.userBookings.findOne({
        where: {
          staffId: userId,
          bookingToDate: {
            [Op.gte]: currentDate,
          },
        },
      });

      if (upcominguserBookings) {
        return res.status(400).json({
          message: "Cannot delete staff with upcoming or ongoing userBookings",
        });
      }
    }

    await models.users.destroy({
      where: {
        id: userId,
      },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user" });
  }
});

//delete service api
users.delete("/deleteService/:serviceId", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const { serviceId } = req.params;

    const service = await models.services.findByPk(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const currentDate = new Date();
    const upcominguserBookings = await models.userBookings.findOne({
      where: {
        serviceId: serviceId,
        bookingToDate: {
          [Op.gte]: currentDate,
        },
      },
    });

    if (upcominguserBookings) {
      return res.status(400).json({
        message: "Cannot delete service with upcoming or ongoing userBookings",
      });
    }

    await models.services.destroy({
      where: {
        id: serviceId,
      },
    });

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete service" });
  }
});

module.exports = users;
