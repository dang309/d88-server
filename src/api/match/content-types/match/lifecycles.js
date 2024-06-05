const { errors } = require("@strapi/utils");
const { ApplicationError } = errors;

const _ = require("lodash");

module.exports = {
  async afterUpdate(event) {
    const { result: updatedMatch } = event;
    const { data } = event.params;

    const { result: matchResult, handicap, overUnder } = updatedMatch;

    if (_.isNil(matchResult) || _.isNil(handicap) || _.isNil(overUnder)) return;

    await _updateBetResult(updatedMatch);
    await _updatePredictions(updatedMatch);
  },
};

async function _updatePredictions(updatedMatch) {
  const { id: matchId, result: matchResult } = updatedMatch;

  if (
    _.isNil(matchResult.firstTeamScore) ||
    _.isNil(matchResult.secondTeamScore)
  )
    return;

  const predictions = await strapi.entityService.findMany(
    "api::prediction.prediction",
    {
      filters: {
        match: {
          id: matchId,
        },
      },
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

    for (const userId of userIdsWithCorrectPredictions) {
      const code = `${matchId}-${userId}`;
      const items = await strapi.entityService.findMany(
        "api::prediction-result.prediction-result",
        {
          filters: {
            code,
          },
        }
      );

      if (items && items.length) continue;

      let prize = predictions.length / userIdsWithCorrectPredictions.length;

      await strapi.entityService.create(
        "api::prediction-result.prediction-result",
        {
          data: {
            match: matchId,
            winner: userId,
            code,
            prize,
          },
        }
      );

      const user = await strapi.entityService.findOne(
        "plugin::users-permissions.user",
        userId
      );

      const balance = user.balance + prize;

      await strapi.entityService.update(
        "plugin::users-permissions.user",
        userId,
        {
          data: {
            balance,
          },
        }
      );
    }
  }
}

async function _updateBetResult(updatedMatch) {
  const {
    result: matchResult,
    handicap,
    overUnder,
    topTeamName,
    firstTeamName,
    secondTeamName,
    id: matchId,
  } = updatedMatch;

  const { firstTeamScore, secondTeamScore } = matchResult;
  const {
    threshold: handicapThreshold,
    firstTeamWinRate,
    secondTeamWinRate,
  } = handicap;
  const {
    threshold: overUnderThreshold,
    overWinRate,
    underWinRate,
  } = overUnder;

  if (
    _.isNil(handicapThreshold) ||
    _.isNil(firstTeamWinRate) ||
    _.isNil(secondTeamWinRate)
  )
    return;
  if (
    _.isNil(overUnderThreshold) ||
    _.isNil(overWinRate) ||
    _.isNil(underWinRate)
  )
    return;
  if (
    _.isNil(matchResult.firstTeamScore) ||
    _.isNil(matchResult.secondTeamScore)
  )
    return;

  const actualScoreOfFirstTeam =
    firstTeamName === topTeamName
      ? firstTeamScore
      : firstTeamScore + handicapThreshold;
  const actualScoreOfSecondTeam =
    secondTeamName === topTeamName
      ? secondTeamScore
      : secondTeamScore + handicapThreshold;
  const winner =
    actualScoreOfFirstTeam > actualScoreOfSecondTeam
      ? firstTeamName
      : secondTeamName;
  const diffScoreHandicap =
    winner === firstTeamName
      ? actualScoreOfFirstTeam - actualScoreOfSecondTeam
      : actualScoreOfSecondTeam - actualScoreOfFirstTeam;

  const totalScores = firstTeamScore + secondTeamScore;
  const diffScoreOverUnder = totalScores - overUnderThreshold;
  const isOver = totalScores > overUnderThreshold;
  const isUnder = totalScores < overUnderThreshold;

  const bets = await strapi.entityService.findMany("api::bet.bet", {
    fields: ["id", "value", "type", "amount"],
    filters: {
      match: {
        id: matchId,
      },
    },
    populate: {
      user: {
        fields: ["id", "balance"],
      },
    },
  });

  for (const bet of bets) {
    const { id: betId, value, type, amount, user } = bet;
    let winOrLoseType = "";
    let profit = 0;
    let loss = 0;
    let balance = user.balance;

    let maxProfit = 0;

    const _bet = await strapi.entityService.findOne("api::bet.bet", betId, {
      fields: ["winOrLoseType"],
    });

    if (_bet && _bet.winOrLoseType) continue;

    if (type === "handicap") {
      maxProfit =
        amount *
        (winner === firstTeamName ? firstTeamWinRate : secondTeamWinRate);

      if (handicapThreshold % 1 === 0) {
        if (diffScoreHandicap === 0) winOrLoseType = "draw";
        else {
          if (value === winner) winOrLoseType = "winFull";
          else winOrLoseType = "loseFull";
        }
      } else if (isHalf(handicapThreshold)) {
        if (value === winner) {
          if (diffScoreHandicap >= 0.5) winOrLoseType = "winFull";
          else winOrLoseType = "loseFull";
        } else {
          if (diffScoreHandicap >= 0.5) winOrLoseType = "loseFull";
          else winOrLoseType = "winFull";
        }
      } else if (isOneQuater(handicapThreshold)) {
        if (value === winner) {
          if (diffScoreHandicap >= 0.25 && diffScoreHandicap < 0.75)
            winOrLoseType = "winHalf";
          else if (diffScoreHandicap >= 0.75) winOrLoseType = "winFull";
        } else {
          if (diffScoreHandicap >= 0.25 && diffScoreHandicap < 0.75)
            winOrLoseType = "loseHalf";
          else if (diffScoreHandicap >= 0.75) winOrLoseType = "loseFull";
        }
      } else if (isThreeQuater(handicapThreshold)) {
        if (value === winner) {
          if (diffScoreHandicap >= 0.25 && diffScoreHandicap < 0.75)
            winOrLoseType = "winHalf";
          else if (diffScoreHandicap >= 0.75) winOrLoseType = "winFull";
        } else {
          if (diffScoreHandicap >= 0.25 && diffScoreHandicap < 0.75)
            winOrLoseType = "loseHalf";
          else if (diffScoreHandicap >= 0.75) winOrLoseType = "loseFull";
        }
      }
    } else if (type === "overUnder") {
      maxProfit = amount * (isOver ? overWinRate : underWinRate);

      if (overUnderThreshold % 1 === 0) {
        if (diffScoreOverUnder === 0) winOrLoseType = "draw";
        if (diffScoreOverUnder > 0) {
          if (value === "over") winOrLoseType = "winFull";
          if (value === "under") winOrLoseType = "loseFull";
        }
        if (diffScoreOverUnder < 0) {
          if (value === "over") winOrLoseType = "loseFull";
          if (value === "under") winOrLoseType = "winFull";
        }
      } else if (isHalf(overUnderThreshold)) {
        if (diffScoreOverUnder > 0) {
          if (value === "over") winOrLoseType = "winFull";
          if (value === "under") winOrLoseType = "loseFull";
        } else {
          if (value === "over") winOrLoseType = "loseFull";
          if (value === "under") winOrLoseType = "winFull";
        }
      } else if (isOneQuater(overUnderThreshold)) {
        // 0.25
        if (diffScoreOverUnder === -0.25) {
          if (value === "over") winOrLoseType = "loseHalf";
          if (value === "under") winOrLoseType = "winHalf";
        }
        if (diffScoreOverUnder >= 0.75) {
          if (value === "over") winOrLoseType = "winFull";
          if (value === "under") winOrLoseType = "loseFull";
        }
        if (diffScoreOverUnder <= -1.25) {
          if (value === "over") winOrLoseType = "loseFull";
          if (value === "under") winOrLoseType = "winFull";
        }
      } else if (isThreeQuater(overUnderThreshold)) {
        if (diffScoreOverUnder === 0.25) {
          if (value === "over") winOrLoseType = "winHalf";
          if (value === "under") winOrLoseType = "loseHalf";
        }
        if (diffScoreOverUnder >= 1.25) {
          if (value === "over") winOrLoseType = "winFull";
          if (value === "under") winOrLoseType = "loseFull";
        }
        if (diffScoreOverUnder <= -0.75) {
          if (value === "over") winOrLoseType = "loseFull";
          if (value === "under") winOrLoseType = "winFull";
        }
      }
    }

    if (winOrLoseType === "draw") {
      balance += amount;
    } else if (winOrLoseType.startsWith("win")) {
      if (winOrLoseType === "winFull") profit = maxProfit;
      else if (winOrLoseType === "winHalf") profit = maxProfit / 2;

      balance += amount + profit;
    } else if (winOrLoseType.startsWith("lose")) {
      if (winOrLoseType === "loseFull") loss = amount;
      else if (winOrLoseType === "loseHalf") {
        loss = amount / 2;
        balance += amount / 2;
      }
    }

    await strapi.entityService.update(
      "plugin::users-permissions.user",
      user.id,
      {
        data: {
          balance,
        },
      }
    );

    await strapi.entityService.update("api::bet.bet", betId, {
      data: {
        profit,
        loss,
        winOrLoseType,
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
