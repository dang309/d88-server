const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    const matchId = data.match?.connect ? data.match?.connect[0]?.id : data?.match;
    const winnerId = data.winner?.connect ? data.winner?.connect[0]?.id : data?.winner; 

    const code = `${matchId}-${winnerId}`;

    const items = await strapi.entityService.findMany(
      "api::prediction-result.prediction-result",
      {
        filters: {
          code,
        },
      }
    );

    if (items && items.length) throw new ApplicationError("Đã tồn tại!");

    data.code = `${matchId}-${winnerId}`;
  },
};
