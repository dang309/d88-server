const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    const user = strapi.requestContext.get().state.user;
    const balance = parseInt(user?.balance || 0, 10);
    const betAmount = parseInt(data?.amount || 0, 10);

    if (betAmount > balance) throw new ApplicationError("Không đủ chip");
  },

  async afterCreate(event) {
    const { result } = event;
    const { data } = event.params;

    const user = strapi.requestContext.get().state.user;

    let balance = parseInt(user?.balance || 0, 10);
    const betAmount = parseInt(result?.amount || 0, 10);

    balance -= betAmount;

    await strapi.services["plugin::users-permissions.user"].edit(user.id, {
      balance,
    });
  },
};
