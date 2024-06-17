"use strict";

/**
 * bet controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const _ = require("lodash");

const MIN_BET_AMOUNT = 1;
const MAX_BET_AMOUNT = 55;

module.exports = createCoreController("api::bet.bet", ({ strapi }) => {
  return {
    async create(ctx) {
      if (_.isNil(ctx.request) || _.isNil(ctx.request.body) || _.isNil(ctx.request.body.data))
        return ctx.badRequest("Đặt cược thất bại. Vui lòng thử lại!");

      const { match: matchId, value, amount } = ctx.request.body.data;

      const user = ctx.state.user;
      let balance = _.toNumber(user.balance);

      if (amount < MIN_BET_AMOUNT) return ctx.badRequest(`Tối thiểu là ${MIN_BET_AMOUNT} chip!`);
      if (amount > MAX_BET_AMOUNT) return ctx.badRequest(`Tối đa là ${MAX_BET_AMOUNT} chip!`);
      if (amount > balance) return ctx.badRequest("Không đủ chip!");

      balance -= _.toNumber(amount);

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

      let data = [];

      const bets = await strapi.entityService.findMany("api::bet.bet", {
        populate: {
          user: {
            fields: ["id", "username", "avatarUrl"],
          },
        },
        fields: ["profit"],
        limit: 99999,
        sort: "profit:desc",
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
              profit: bet.profit,
            };

            data.push(user);
          } else {
            user.profit += bet.profit;
          }
        }
      }

      data = data.slice(0, 3).sort((a, b) => b.profit - a.profit);

      const sanitizedResults = await this.sanitizeOutput(data, ctx);

      return this.transformResponse(sanitizedResults);
    },
    async delete(ctx) {
      if (_.isNil(ctx.request) || _.isNil(ctx.request.params)) return ctx.badRequest("Hủy cược thất bại. Vui lòng thử lại!");

      const { id } = ctx.request.params;
      const user = ctx.state.user;

      if (id) {
        const bet = await strapi.entityService.findOne("api::bet.bet", id);

        if (bet) {
          const betAmount = bet.amount;
          const balance = user.balance + betAmount;

          const response = await Promise.all([
            super.delete(ctx),
            strapi.entityService.update("plugin::users-permissions.user", user.id, {
              data: {
                balance,
              },
            }),
          ]);

          return response;
        }
      }

      return ctx.badRequest("Hủy cược thất bại. Vui lòng thử lại!");
    },
  };
});
