const express = require("express");
const routes = require("./routes");
const { CronJob } = require('cron');
const Sib = require('sib-api-v3-sdk');
const models = require('./db/models');
const { Op } = require('sequelize');
const client = Sib.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.API_KEY;
const tranEmailApi = new Sib.TransactionalEmailsApi();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
require("dotenv").config();
app.use(express.json());
app.use("/api", routes);


app.get("/", (req, res) => {
  res.status(200).json({ status: "suceess", message: "Rest API" });
});

const reminderJob = new CronJob('0 9 * * *', async () => {
  const reminderTimeFrame = new Date();
  reminderTimeFrame.setDate(reminderTimeFrame.getDate() + 1);
  try {
    const upcomingBookings = await models.userBookings.findAll({
      where: {
        bookingFromDate: {
          [Op.between]: [new Date(), reminderTimeFrame]
        }
      },
      include: [{ model: models.users, as: 'user', attributes: ['name', 'email'] }]
    });

    for (const booking of upcomingBookings) {
      const { user, serviceId, staffId, bookingFromDate, bookingToDate } = booking;

      const service = await models.services.findByPk(serviceId);
      const staff = await models.users.findByPk(staffId);

      if (user && user.email) {
        const sender = { email: 'javagalsrinath.619@gmail.com', name: 'Srinath' };
        const receiver = [{ email: user.email, name: user.name || 'Customer' }];

        await tranEmailApi.sendTransacEmail({
          sender,
          to: receiver,
          subject: "Upcoming Booking Reminder",
          textContent: `
            Dear ${user.name || "Customer"},
            
            This is a reminder for your upcoming appointment.
            
            Service: ${service.name}
            Staff Assigned: ${staff.name}
            Start Time: ${bookingFromDate}
            End Time: ${bookingToDate}
            
            Looking forward to serving you!
            Best regards, Srinath
          `,
          htmlContent: `
            <h3>Upcoming Booking Reminder</h3>
            <p>Dear ${user.name || "Customer"},</p>
            <p>This is a reminder for your upcoming appointment.</p>
            <ul>
              <li><strong>Service:</strong> ${service.name}</li>
              <li><strong>Staff Assigned:</strong> ${staff.name}</li>
              <li><strong>Start Time:</strong> ${bookingFromDate}</li>
              <li><strong>End Time:</strong> ${bookingToDate}</li>
            </ul>
            <p>Looking forward to serving you!</p>
            <p>Best regards,<br>Srinath</p>
          `
        });
        console.log(`Reminder email sent to: ${user.email}`);
      }
    }
  } catch (error) {
    console.error("Error sending reminder emails:", error);
  }
});

app.listen(3000, () => {
  console.log("Server up and running");
  reminderJob.start();
});
