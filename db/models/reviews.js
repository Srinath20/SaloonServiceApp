"use strict";
const { Model, DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class reviews extends Model {
    // /**
    //  * Helper method for defining associations.
    //  * This method is not a part of DataTypes lifecycle.
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
  reviews.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        // defaultValue: DataTypes.UUIDV4,
      },
      bookingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "userBookings",
          key: "id",
        },
      },
      review: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      staffResponse: {
        type: DataTypes.TEXT,
      },
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
      modelName: "reviews",
      timestamps: true,
    }
  );
  return reviews;
};
