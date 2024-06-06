"use strict";

/**
 * bet controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::bet.bet", ({ strapi }) => {
  return {
    async findHallOfFame(ctx) {
      await this.validateQuery(ctx);
      let bets = await strapi.entityService.findMany("api::bet.bet", {
        populate: {
          user: {
            fields: ["id", "username", "avatarUrl"],
          },
        },
        fields: ["profit"],
      });

      bets = bets
        .reduce((acc, bet) => {
          let user = acc.find((item) => item.id === bet.user.id);
          if (!user) {
            user = {
              id: bet.user.id,
              username: bet.user.username,
              avatarUrl: bet.user.avatarUrl,
              profit: 0,
            };
            acc.push(user);
          }

          user.profit += bet.profit;

          return acc;
        }, [])
        .sort((b, a) => b.profit - a.profit);

      const sanitizedResults = await this.sanitizeOutput(bets, ctx);

      return this.transformResponse(sanitizedResults);
    },
  };
});
