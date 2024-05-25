import type { Schema, Attribute } from '@strapi/strapi';

export interface BetHandicap extends Schema.Component {
  collectionName: 'components_bet_handicaps';
  info: {
    displayName: 'handicap';
    icon: 'chartBubble';
  };
  attributes: {
    threshold: Attribute.Decimal;
    firstTeamWinRate: Attribute.Decimal;
    secondTeamWinRate: Attribute.Decimal;
  };
}

export interface BetOverUnder extends Schema.Component {
  collectionName: 'components_bet_over_unders';
  info: {
    displayName: 'overUnder';
    icon: 'check';
    description: '';
  };
  attributes: {
    threshold: Attribute.Decimal;
    overWinRate: Attribute.Decimal;
    underWinRate: Attribute.Decimal;
  };
}

export interface MatchResult extends Schema.Component {
  collectionName: 'components_match_results';
  info: {
    displayName: 'Result';
    icon: 'briefcase';
  };
  attributes: {
    firstTeamScore: Attribute.Integer;
    secondTeamScore: Attribute.Integer;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'bet.handicap': BetHandicap;
      'bet.over-under': BetOverUnder;
      'match.result': MatchResult;
    }
  }
}
