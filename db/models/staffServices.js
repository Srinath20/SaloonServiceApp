"use strict";
const { Model, DataTypes } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class staffservices extends Model {
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
  staffservices.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        // defaultValue: DataTypes.UUIDV4,
      },
      staffId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "services",
          key: "id",
        },
        onDelete: "CASCADE",
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
      modelName: "staffservices",
      timestamps: true,
    }
  );
  return staffservices;
};
