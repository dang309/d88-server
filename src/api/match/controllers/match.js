"use strict";

/**
 * match controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const moment = require("moment");

module.exports = createCoreController("api::match.match", ({ strapi }) => {
  return {
    async find(ctx) {
      // const { data, meta } = await super.find(ctx);
      const { data, meta } = await strapi
        .service("api::match.match")
        .find(ctx.params);

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
      });

      if (matches && matches.length) {
        const comingMatch = matches[0];
        comingMatch.datetime = moment(comingMatch.datetime)
          .locale('vi')
          .format("DD/MM HH:mm");
        data = comingMatch;
      }

      return {
        data,
      };
    },
  };
});
