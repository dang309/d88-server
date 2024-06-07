"use strict";

/**
 * match controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const moment = require('moment-timezone');

module.exports = createCoreController("api::match.match", ({ strapi }) => {
  return {
    async find(ctx) {
      const { data, meta } = await strapi
        .service("api::match.match")
        .find(ctx.request.query);

      return { data, meta };
    },
    async getComing(ctx) {
      let data = {};
      const matches = await strapi.entityService.findMany("api::match.match", {
        filters: {
          datetime: {
            $gte: moment().utc(),
          },
        },
        sort: "datetime",
        limit: 1,
        populate: ['result', 'handicap', 'overUnder']
      });

      if (matches && matches.length) {
        const comingMatch = matches[0];
        comingMatch.datetime = moment(comingMatch.datetime)
          .tz('Asia/Ho_Chi_Minh')
          .format("DD/MM HH:mm");
        data = comingMatch;
      }

      return {
        data,
      };
    },
  };
});
