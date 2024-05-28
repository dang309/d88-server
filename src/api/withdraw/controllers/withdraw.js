"use strict";

/**
 * withdraw controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::withdraw.withdraw",
  ({ strapi }) => {
    return {
      async create(ctx) {
        const user = ctx.state.user;

        const balance = parseInt(user?.balance, 10) || 0;
        const amountToWithDraw =
          parseInt(ctx.request.body?.data?.amount, 10) || 0;

        if (amountToWithDraw > balance) return ctx.badRequest("Không đủ chip");

        const newBalance = balance - amountToWithDraw;

        const response = await super.create(ctx);

        await strapi.services["plugin::users-permissions.user"].edit(user.id, {
          balance: newBalance,
        });

        return response;
      },
    };
  }
);
