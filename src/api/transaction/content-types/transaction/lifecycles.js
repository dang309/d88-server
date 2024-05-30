const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

const TRANSACTION_TYPE = {
  RECHARGE: "recharge",
  WITHDRAW: "withdraw",
};

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

      const balance = user.balance;
      const amount = parseInt(data.amount, 10);
      const type = data.type;

      if (amount < 1) throw new ApplicationError("Tối thiểu là 1 chip!");

      if (type === TRANSACTION_TYPE.WITHDRAW) {
        if (amount > balance) throw new ApplicationError("Không đủ chip!");
      }
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
      const amount = parseInt(result.amount, 10);
      const type = result.type;

      if (type === TRANSACTION_TYPE.RECHARGE) balance += amount;
      else if (type === TRANSACTION_TYPE.WITHDRAW) balance -= amount;

      const newEntry = await strapi.entityService.update(
        "plugin::users-permissions.user",
        user.id,
        {
          data: {
            balance,
          },
        }
      );
    }
  },
};
