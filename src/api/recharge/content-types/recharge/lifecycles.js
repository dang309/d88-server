module.exports = {
  async afterCreate(event) {
    const { params } = event;

    const userId = params?.data?.user?.connect[0]?.id;

    if (userId) {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      const balance = parseInt(user?.balance || 0, 10);
      const amountToRecharge = parseInt(params?.data?.amount || 0, 10);

      const newBalance = balance + amountToRecharge;

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
