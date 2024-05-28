'use strict';

/**
 * recharge service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::recharge.recharge');
