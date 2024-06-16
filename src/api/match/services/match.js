"use strict";

/**
 * match service
 */

const { createCoreService } = require("@strapi/strapi").factories;
const moment = require("moment-timezone");
const _ = require("lodash");

module.exports = createCoreService("api::match.match", ({ strapi }) => {
  return {
    async find() {
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
        populate: ["result", "handicap", "overUnder"],
        filters: {
          datetime: {
            $gte: moment().utc(),
          },
        },
        sort: "datetime",
      });

      if (items && items.length) {
        for (const item of items) {
          item.datetime = moment(item.datetime).tz("Asia/Ho_Chi_Minh");
          item.time = moment(item.datetime).format("HH:mm");

          const date = moment(item.datetime).format("DD/MM");

          item.datetime = item.datetime.format("DD/MM HH:mm");

          if (!_.isNil(item.handicap) && !_.isEmpty(item.handicap)) {
            item.handicap = item.handicap[item.handicap.length - 1];
          }

          if (!_.isNil(item.overUnder) && !_.isEmpty(item.overUnder)) {
            item.overUnder = item.overUnder[item.overUnder.length - 1];
          }

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
