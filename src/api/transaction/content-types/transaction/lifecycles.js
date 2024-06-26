const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

const _ = require("lodash");

const TRANSACTION_TYPE = {
  RECHARGE: "recharge",
  WITHDRAW: "withdraw",
};

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    const userId = data.user?.connect[0]?.id;

    if (userId) {
      const user = await strapi.entityService.findOne("plugin::users-permissions.user", userId);

      const balance = _.toNumber(user.balance);
      const amount = _.toNumber(data.amount);
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

    const userId = data.user?.connect[0]?.id;

    if (userId) {
      const user = await strapi.entityService.findOne("plugin::users-permissions.user", userId);

      let balance = _.toNumber(user.balance);
      const amount = _.toNumber(result.amount);
      const type = result.type;
      const data = {};

      if (type === TRANSACTION_TYPE.RECHARGE) balance += amount;
      else if (type === TRANSACTION_TYPE.WITHDRAW) balance -= amount;

      data.balance = balance;

      await strapi.entityService.update("plugin::users-permissions.user", user.id, {
        data,
      });
    }
  },
};
