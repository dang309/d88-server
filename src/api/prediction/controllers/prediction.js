"use strict";

/**
 * prediction controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController(
  "api::prediction.prediction",
  ({ strapi }) => {
    return {
      async create(ctx) {
        const user = ctx.state.user;
        let balance = parseInt(user?.balance, 10) || 0;

        if (balance < 1) return ctx.badRequest("Không đủ chip");

        balance -= 1

        const response = await super.create(ctx);

        await strapi.services["plugin::users-permissions.user"].edit(user.id, {
          balance,
        });

        return response;
      },
    };
  }
);
