"use strict";

/**
 * bet controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const _ = require("lodash");

module.exports = createCoreController("api::bet.bet", ({ strapi }) => {
  return {
    async create(ctx) {
      const {
        user: userId,
        match: matchId,
        type,
        value,
        amount,
      } = ctx.request.body.data;
      const user = ctx.state.user;
      let balance = _.get(user, "balance");

      if (amount < 1) return ctx.badRequest("Tối thiểu là 1 chip!");
      if (amount % 1 !== 0) return ctx.badRequest("Chip không được lẻ!");
      if (amount > balance) return ctx.badRequest("Không đủ chip!");

      balance -= amount;

      const existedBets = await strapi.entityService.findMany("api::bet.bet", {
        filters: {
          $and: [
            {
              match: matchId,
            },
            {
              user: user.id,
            },
            {
              value,
            },
          ],
        },
        limit: 1,
      });

      if (!_.isEmpty(existedBets)) {
        const bet = existedBets[0];
        if (bet.winOrLoseType) return ctx.badRequest("Trận đấu đã kết thúc!");

        bet.amount += amount;

        await Promise.all([
          strapi.entityService.update("api::bet.bet", bet.id, {
            data: {
              ...bet,
            },
          }),
          strapi.services["plugin::users-permissions.user"].edit(user.id, {
            balance,
          }),
        ]);

        return {
          data: bet,
        };
      }

      const [response] = await Promise.all([
        super.create(ctx),
        strapi.services["plugin::users-permissions.user"].edit(user.id, {
          balance,
        }),
      ]);

      return response;
    },
    async findHallOfFame(ctx) {
      await this.validateQuery(ctx);

      const data = [];

      const bets = await strapi.entityService.findMany("api::bet.bet", {
        populate: {
          user: {
            fields: ["id", "username", "avatarUrl"],
          },
        },
        fields: ["profit"],
      });

      if (!_.isEmpty(bets)) {
        for (const bet of bets) {
          if (_.isNil(bet.profit) || bet.profit === 0) continue;

          let user = data.find((item) => item.id === bet.user.id);

          if (!user) {
            user = {
              id: bet.user.id,
              username: bet.user.username,
              avatarUrl: bet.user.avatarUrl,
              profit: 0,
            };

            user.profit += bet.profit;

            data.push(user);
          }
        }
      }

      const sanitizedResults = await this.sanitizeOutput(data, ctx);

      return this.transformResponse(sanitizedResults);
    },
  };
});
