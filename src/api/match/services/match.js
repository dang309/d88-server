"use strict";

/**
 * match service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const moment = require("moment");
const _ = require("lodash");

module.exports = createCoreService("api::match.match", ({ strapi }) => {
  return {
    async find(params) {
      const meta = {
        pagination: {
          page: 0,
          pageSize: 0,
          pageCount: 0,
          total: 0,
        },
      };
      let data = {};

      const items = await strapi.entityService.findMany("api::match.match", {
        ...params,
      });

      if (items && items.length) {
        for (const item of items) {
          item.datetime = moment(item.datetime).local();
          item.time = moment(item.datetime).format("HH:mm");

          const date = moment(item.datetime).format("DD/MM");

          item.datetime = item.datetime.format('DD/MM HH:mm')

          if (!_.has(data, date)) {
            data[date] = [item];
          } else {
            data[date].push(item);
          }
        }
      }

      return { data, meta };
    },
  };
});
