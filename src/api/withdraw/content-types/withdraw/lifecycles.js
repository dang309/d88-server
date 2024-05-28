const { errors } = require('@strapi/utils');
const { ApplicationError } = errors;

module.exports = {
  async beforeCreate(event) {
    const { params } = event;

    const userId = params?.data?.user?.connect[0]?.id;

    if (userId) {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      const balance = parseInt(user?.balance || 0, 10);
      const amountToWithDraw = parseInt(params?.data?.amount || 0, 10);

      if(amountToWithDraw > balance) throw new ApplicationError('Không đủ chip');

      const newBalance = balance - amountToWithDraw;

      await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            balance: newBalance,
          },
        }
      );
    }
  },
};
