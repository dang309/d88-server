"use strict";

/**
 * match controller
 */

const { createCoreController } = require("@strapi/strapi").factories;
const moment = require("moment");

module.exports = createCoreController("api::match.match", ({ strapi }) => {
  return {
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
        return {
          data: matches[0],
        };

      return {
        data: [],
      };
    },
  };
});
