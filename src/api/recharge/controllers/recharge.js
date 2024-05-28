"use strict";

/**
 * recharge controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::recharge.recharge",
  ({ strapi }) => {
    return {
      async create(ctx) {
        const user = ctx.state.user;

        let balance = parseInt(user?.balance, 10) || 0;
        console.log({balance})
        const amountToRecharge = parseInt(ctx.request.body?.data?.amount, 10) || 0 
        balance += amountToRecharge

        console.log({balance, amountToRecharge})

        const response = await super.create(ctx);

        await strapi.services["plugin::users-permissions.user"].edit(user.id, {
          balance,
        });

        return response;
      },
    };
  }
);
