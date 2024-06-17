"use strict";

/**
 * prediction controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::prediction.prediction", ({ strapi }) => {
  return {
    async create(ctx) {
      const user = ctx.state.user;
      let balance = parseInt(user?.balance, 10) || 0;

      if (balance < 1) return ctx.badRequest("Không đủ chip");

      const jackpot = await strapi.entityService.findMany("api::jackpot.jackpot", {
        fields: ["amount"],
      });

      const response = await Promise.all([
        super.create(ctx),
        strapi.services["plugin::users-permissions.user"].edit(user.id, {
          balance,
        }),
        strapi.entityService.update("api::jackpot.jackpot", 1, {
          data: {
            amount: jackpot.amount + 1,
          },
        }),
      ]);

      return response;
    },
  };
});
