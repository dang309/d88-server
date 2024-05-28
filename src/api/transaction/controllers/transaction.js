"use strict";

/**
 * transaction controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::transaction.transaction",
  ({ strapi }) => {
    return {
      async create(ctx) {
        const user = ctx.state.user
        const balance = parseInt(user?.balance, 10) || 0;
        const betAmount = parseInt(ctx.request.body?.data?.betAmount, 10) || 0;

        if (betAmount > balance) return ctx.badRequest("Không đủ chip")

        const newBalance = balance - betAmount;

        const response = await super.create(ctx);

        await strapi.services['plugin::users-permissions.user'].edit(user.id, {
            balance: newBalance
        })

        return response;
      },
    };
  }
);
