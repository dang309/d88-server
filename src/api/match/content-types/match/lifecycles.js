const _ = require("lodash");

const MIN_JACK_POT = 5;

module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    const { firstTeamName, secondTeamName, type } = data;

    data.code = `${type.toLowerCase()}-${firstTeamName.toLowerCase()}-${secondTeamName.toLowerCase()}`;
  },
  async afterUpdate(event) {
    const { result: updatedMatch } = event;

    const { result: matchResult, handicap, overUnder } = updatedMatch;

    if (_.isNil(matchResult) || _.isNil(handicap) || _.isNil(overUnder)) return;
    if (_.isEmpty(handicap) || _.isEmpty(overUnder)) return;

    await _updateBetResult(updatedMatch);
    await _updatePredictions(updatedMatch);
  },
};

async function _updatePredictions(updatedMatch) {
  const { id: matchId, result: matchResult } = updatedMatch;

  if (_.isNil(matchResult.firstTeamScore) || _.isNil(matchResult.secondTeamScore)) return;

  const predictions = await strapi.entityService.findMany("api::prediction.prediction", {
    filters: {
      match: {
        id: matchId,
      },
    },
    populate: "user",
  });

  let correctPreds = [];

  for (const pred of predictions) {
    if (!_.isNil(pred.isCorrect) || !_.isNil(pred.isCelebrated)) continue;
    if (pred.firstTeamScore == matchResult.firstTeamScore && pred.secondTeamScore == matchResult.secondTeamScore)
      correctPreds.push({
        userId: pred?.user?.id,
        predictionId: pred.id,
      });
  }

  if (correctPreds.length) {
    correctPreds = _.uniqBy(correctPreds, "userId");

    for (const correctPred of correctPreds) {
      const jackpot = await strapi.entityService.findMany("api::jackpot.jackpot", {
        fields: ["amount"],
      });

      let prize = 0;

      if (jackpot) {
        prize = _.toNumber(jackpot.amount) / correctPreds.length;
      }

      const user = await strapi.entityService.findOne("plugin::users-permissions.user", correctPred.userId);
      const balance = _.toNumber(user.balance) + _.toNumber(prize);

      await Promise.all([
        strapi.entityService.update("plugin::users-permissions.user", correctPred.userId, {
          data: {
            balance,
          },
        }),
        strapi.entityService.update("api::prediction.prediction", correctPred.predictionId, {
          data: {
            isCorrect: true,
            isCelebrated: false,
            prize,
          },
        }),
        strapi.entityService.update("api::jackpot.jackpot", 1, {
          data: {
            amount: MIN_JACK_POT,
          },
        }),
      ]);
    }
  }
}

async function _updateBetResult(updatedMatch) {
  const {
    result: matchResult,
    topTeamName: tTeamName,
    firstTeamName: fTeamName,
    secondTeamName: sTeamName,
    id: matchId,
  } = updatedMatch;

  const { firstTeamScore, secondTeamScore } = matchResult;

  if (_.isNil(matchResult.firstTeamScore) || _.isNil(matchResult.secondTeamScore)) return;

  const bets = await strapi.entityService.findMany("api::bet.bet", {
    fields: ["id", "value", "type", "amount", "winOrLoseType"],
    filters: {
      match: {
        id: matchId,
      },
    },
    populate: {
      user: {
        fields: ["id", "balance"],
      },
      handicap: true,
      overUnder: true,
    },
  });

  for (const bet of bets) {
    const { id: betId, value, type, amount, handicap, overUnder, winOrLoseType, user } = bet;
    let _winOrLoseType = winOrLoseType || "";
    let profit = 0;
    let loss = 0;
    let isCelebrated = null;

    const _user = await strapi.entityService.findOne("plugin::users-permissions.user", user.id);

    let balance = _user.balance;

    let maxProfit = 0;

    if (winOrLoseType) continue;

    if (type === "handicap") {
      if (_.isNil(handicap)) continue;

      const { threshold, firstTeamWinRate, secondTeamWinRate } = handicap;

      if (_.isNil(threshold) || _.isNil(firstTeamWinRate) || _.isNil(secondTeamWinRate)) continue;

      const finalFTeamScore = fTeamName === tTeamName ? firstTeamScore : firstTeamScore + threshold;
      const finalSTeamScore = sTeamName === tTeamName ? secondTeamScore : secondTeamScore + threshold;
      const winner = finalFTeamScore > finalSTeamScore ? fTeamName : sTeamName;
      const diffHandicap = winner === fTeamName ? finalFTeamScore - finalSTeamScore : finalSTeamScore - finalFTeamScore;

      maxProfit = amount * (winner === fTeamName ? firstTeamWinRate : secondTeamWinRate);

      if (threshold % 1 === 0) {
        if (diffHandicap === 0) _winOrLoseType = "draw";
        else {
          if (value === winner) _winOrLoseType = "winFull";
          else _winOrLoseType = "loseFull";
        }
      } else if (isHalf(threshold)) {
        if (value === winner) {
          if (diffHandicap >= 0.5) _winOrLoseType = "winFull";
          else _winOrLoseType = "loseFull";
        } else {
          if (diffHandicap >= 0.5) _winOrLoseType = "loseFull";
          else _winOrLoseType = "winFull";
        }
      } else if (isOneQuater(threshold)) {
        if (value === winner) {
          if (diffHandicap >= 0.25 && diffHandicap < 0.75) _winOrLoseType = "winHalf";
          else if (diffHandicap >= 0.75) _winOrLoseType = "winFull";
        } else {
          if (diffHandicap >= 0.25 && diffHandicap < 0.75) _winOrLoseType = "loseHalf";
          else if (diffHandicap >= 0.75) _winOrLoseType = "loseFull";
        }
      } else if (isThreeQuater(threshold)) {
        if (value === winner) {
          if (diffHandicap >= 0.25 && diffHandicap < 0.75) _winOrLoseType = "winHalf";
          else if (diffHandicap >= 0.75) _winOrLoseType = "winFull";
        } else {
          if (diffHandicap >= 0.25 && diffHandicap < 0.75) _winOrLoseType = "loseHalf";
          else if (diffHandicap >= 0.75) _winOrLoseType = "loseFull";
        }
      }
    } else if (type === "overUnder") {
      if (_.isNil(overUnder)) continue;

      const { threshold, overWinRate, underWinRate } = overUnder;

      if (_.isNil(threshold) || _.isNil(overWinRate) || _.isNil(underWinRate)) continue;

      const totalScores = firstTeamScore + secondTeamScore;
      const diffScoreOverUnder = totalScores - threshold;
      const isOver = totalScores > threshold;

      maxProfit = amount * (isOver ? overWinRate : underWinRate);

      if (threshold % 1 === 0) {
        if (diffScoreOverUnder === 0) _winOrLoseType = "draw";
        if (diffScoreOverUnder > 0) {
          if (value === "over") _winOrLoseType = "winFull";
          if (value === "under") _winOrLoseType = "loseFull";
        }
        if (diffScoreOverUnder < 0) {
          if (value === "over") _winOrLoseType = "loseFull";
          if (value === "under") _winOrLoseType = "winFull";
        }
      } else if (isHalf(threshold)) {
        if (diffScoreOverUnder > 0) {
          if (value === "over") _winOrLoseType = "winFull";
          if (value === "under") _winOrLoseType = "loseFull";
        } else {
          if (value === "over") _winOrLoseType = "loseFull";
          if (value === "under") _winOrLoseType = "winFull";
        }
      } else if (isOneQuater(threshold)) {
        // 0.25
        if (diffScoreOverUnder === -0.25) {
          if (value === "over") _winOrLoseType = "loseHalf";
          if (value === "under") _winOrLoseType = "winHalf";
        }
        if (diffScoreOverUnder >= 0.75) {
          if (value === "over") _winOrLoseType = "winFull";
          if (value === "under") _winOrLoseType = "loseFull";
        }
        if (diffScoreOverUnder <= -1.25) {
          if (value === "over") _winOrLoseType = "loseFull";
          if (value === "under") _winOrLoseType = "winFull";
        }
      } else if (isThreeQuater(threshold)) {
        if (diffScoreOverUnder === 0.25) {
          if (value === "over") _winOrLoseType = "winHalf";
          if (value === "under") _winOrLoseType = "loseHalf";
        }
        if (diffScoreOverUnder >= 1.25) {
          if (value === "over") _winOrLoseType = "winFull";
          if (value === "under") _winOrLoseType = "loseFull";
        }
        if (diffScoreOverUnder <= -0.75) {
          if (value === "over") _winOrLoseType = "loseFull";
          if (value === "under") _winOrLoseType = "winFull";
        }
      }
    }

    if (_winOrLoseType === "draw") {
      balance += amount;
    } else if (_winOrLoseType.startsWith("win")) {
      if (_winOrLoseType === "winFull") profit = maxProfit;
      else if (_winOrLoseType === "winHalf") profit = maxProfit / 2;

      balance += amount + profit;
      isCelebrated = false;
    } else if (_winOrLoseType.startsWith("lose")) {
      if (_winOrLoseType === "loseFull") loss = amount;
      else if (_winOrLoseType === "loseHalf") {
        loss = amount / 2;
        balance += amount / 2;
      }
    }

    await strapi.entityService.update("plugin::users-permissions.user", _user.id, {
      data: {
        balance,
      },
    });

    await strapi.entityService.update("api::bet.bet", betId, {
      data: {
        profit,
        loss,
        winOrLoseType: _winOrLoseType,
        isCelebrated,
      },
    });
  }
}

function isOneQuater(number) {
  return Math.abs(number % 1) === 0.25;
}

function isHalf(number) {
  return Math.abs(number % 1) === 0.5;
}

function isThreeQuater(number) {
  return Math.abs(number % 1) === 0.75;
}
