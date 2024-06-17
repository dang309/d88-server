"use strict";

/**
 * prediction controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const _ = require("lodash");

module.exports = createCoreController("api::prediction.prediction", ({ strapi }) => {
  return {
    async create(ctx) {
      const { match } = ctx.request.body.data;
      const user = ctx.state.user;

      const existedPredictions = await strapi.entityService.findMany("api::prediction.prediction", {
        filters: {
          $and: [
            {
              match,
            },
            {
              user: user.id,
            },
          ],
        },
        limit: 1,
      });

      if (!_.isEmpty(existedPredictions)) return ctx.badRequest("Chỉ được đặt 1 tỉ số/ trận.");

      let balance = parseInt(user?.balance, 10) || 0;

      if (balance < 1) return ctx.badRequest("Không đủ chip");

      const jackpot = await strapi.entityService.findMany("api::jackpot.jackpot", {
        fields: ["amount"],
      });

      balance -= 1;

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
    async delete(ctx) {
      const user = ctx.state.user;
      let balance = parseInt(user?.balance, 10) || 0;

      balance += 1;

      const jackpot = await strapi.entityService.findMany("api::jackpot.jackpot", {
        fields: ["amount"],
      });

      const response = await Promise.all([
        super.delete(ctx),
        strapi.services["plugin::users-permissions.user"].edit(user.id, {
          balance,
        }),
        strapi.entityService.update("api::jackpot.jackpot", 1, {
          data: {
            amount: jackpot.amount - 1,
          },
        }),
      ]);

      return response;
    },
  };
});
