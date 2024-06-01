const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

const _ = require("lodash");

module.exports = {
  async afterUpdate(event) {
    const { result } = event;
    const { data } = event.params;

    const { result: matchResult } = result;

    if (
      !_.isNil(matchResult.firstTeamScore) &&
      !_.isNil(matchResult.secondTeamScore)
    ) {
      const predictions = await strapi.entityService.findMany(
        "api::prediction.prediction",
        {
          populate: "user",
        }
      );

      let userIdsWithCorrectPredictions = [];

      predictions.forEach((pred) => {
        if (
          pred.firstTeamScore === matchResult.firstTeamScore &&
          pred.secondTeamScore === matchResult.secondTeamScore
        )
          userIdsWithCorrectPredictions.push(pred?.user?.id);
      });

      if (userIdsWithCorrectPredictions.length) {
        userIdsWithCorrectPredictions = Array.from(
          new Set(userIdsWithCorrectPredictions)
        );

        const promises = [];

        userIdsWithCorrectPredictions.forEach((userId) => {
          promises.push(
            strapi.entityService.create(
              "api::prediction-result.prediction-result",
              {
                data: {
                  match: result?.id,
                  winner: userId,
                },
              }
            )
          );
        });

        Promise.all(promises);
      }
    }
  },
};
