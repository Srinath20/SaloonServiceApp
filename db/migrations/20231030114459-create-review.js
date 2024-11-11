"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "reviews",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
          // defaultValue: Sequelize.UUIDV4,
        },
        bookingId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "userBookings",
            key: "id",
          },
          onDelete: "CASCADE",
        },

        review: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        rating: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        staffResponse: {
          type: Sequelize.TEXT,
        },

        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
        },
      },
      {
        timestamps: true,
      }
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable(
      "reviews"
    )
  },
};
