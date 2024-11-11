const { DataTypes } = require("sequelize");

("use strict");
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class userss extends Model {
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
  userss.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        // defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: { type: DataTypes.STRING, allowNull: false },
      mobile: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false },

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
      modelName: "users",
      timestamps: true,
    }
  );
  return userss;
};
