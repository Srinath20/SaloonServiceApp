"use strict";
const { Model, DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class services extends Model {

  }
  services.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        // defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },

      price: { type: DataTypes.INTEGER, allowNull: false },
      hours: { type: DataTypes.INTEGER, allowNull: false },

      fromDate: { type: DataTypes.DATE },
      toDate: { type: DataTypes.DATE },

      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },

    {
      sequelize,
      modelName: "services",
      timestamps: true,
    }
  );
  return services;
};
