"use strict";
const { Model, DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class services extends Model {
    // /**
    //  * Helper method for defining associations.
    //  * This method is not a part of Sequelize lifecycle.
    //  * The `models/index` file will call this method automatically.
    //  */
    // static associate(models) {
    //   curriculumActuals.belongsTo(models.curriculumReviewMaster, {
    //     foreignKey: 'curriculumId', // 'action' is the foreign key column
    //     as: 'CurriculumId', // You can customize the alias as needed
    //     onDelete: 'CASCADE',
    //   });
    //   curriculumActuals.belongsTo(models.curriculumActionMaster, {
    //     foreignKey: 'curriculumActionMasterId', // 'action' is the foreign key column
    //     as: 'CurriculumActionMasterId', // You can customize the alias as needed
    //   });
    // }
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
