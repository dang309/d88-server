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
      const matches = await strapi.entityService.findMany("api::match.match", {
        filters: {
          datetime: {
            $gte: moment().utc(),
          },
        },
        sort: "datetime",
      });

      if (matches && matches.length)
        matches[0].datetime = moment(matches[0].datetime)
          .local()
          .format("DD/MM HH:mm");
      return {
        data: matches[0],
      };

      return {
        data: [],
      };
    },
  };
});
