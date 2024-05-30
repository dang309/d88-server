const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;
    let userId;

    const ctx = strapi.requestContext.get();
    if (ctx.request.url.startsWith("/api")) {
      userId = ctx.state.user.id;
    } else if (ctx.request.url.startsWith("/content-manager")) {
      userId = data.user?.connect[0]?.id;
    }

    if (userId) {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      const balance = user.balance
      const betAmount = parseInt(data.amount || 0, 10);

      if (betAmount < 1) throw new ApplicationError("Tối thiểu là 1 chip!");
      if (betAmount % 1 !== 0)
        throw new ApplicationError("Chip không được lẻ!");
      if (betAmount > balance) throw new ApplicationError("Không đủ chip!");
    }
  },

  async afterCreate(event) {
    const { result } = event;
    const { data } = event.params;
    let userId;

    const ctx = strapi.requestContext.get();
    if (ctx.request.url.startsWith("/api")) {
      userId = ctx.state.user.id;
    } else if (ctx.request.url.startsWith("/content-manager")) {
      userId = data.user?.connect[0]?.id;
    }
    
    if (userId) {
      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      let balance = user.balance;
      const betAmount = result.amount;

      balance -= betAmount;

      await strapi.services["plugin::users-permissions.user"].edit(user.id, {
        balance,
      });
    }
  },
};
