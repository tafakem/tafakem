import { Match, TeamStats, MatchProbabilityResult, CornerProbabilityResult } from '../types/football';
import { calculateMatchProbabilities, calculateCornerProbprobabilities } from './analytics';

export interface AdvancedMarketResult {
  double_chance: {
    one_x: number;
    x_two: number;
    one_two: number;
  };
  goals_markets: {
    over_05: number;
    over_15: number;
    over_25: number;
    under_25: number;
    btts_yes: number;
    btts_no: number;
    ht_over_05: number;
    ht_over_15: number;
  };
  corner_markets: {
    total_lines: { line: number; over: number; under: number }[];
    home_over_35: number;
    home_over_45: number;
    away_over_35: number;
    away_over_45: number;
  };
  card_markets: {
    over_15_cards: number;
    over_25_cards: number;
  };
  combos: {
    one_x_and_over_15: number;
    x_two_and_over_15: number;
  };
}

export function calculateAdvancedMarkets(
  homeTeam: string,
  awayTeam: string,
  matches: Match[]
): AdvancedMarketResult {
  const matchProbs = calculateMatchProbabilities(homeTeam, awayTeam, matches);
  const cornerProbs = calculateCornerProbprobabilities(homeTeam, awayTeam, matches);

  const homeWin = matchProbs.home_win_prob;
  const draw = matchProbs.draw_prob;
  const awayWin = matchProbs.away_win_prob;

  // Double chance
  const one_x = Number((homeWin + draw).toFixed(1));
  const x_two = Number((draw + awayWin).toFixed(1));
  const one_two = Number((homeWin + awayWin).toFixed(1));

  // Goals
  const ou25_over = matchProbs.over_under.over_25 ?? 50.0;
  const ou25_under = matchProbs.over_under.under_25 ?? 50.0;
  const btts_yes = matchProbs.btts.yes;
  const btts_no = matchProbs.btts.no;

  const exactScoresList = matchProbs.exact_scores || matchProbs.correct_scores || [];
  const exact00 = exactScoresList.find(s => s.home === 0 && s.away === 0)?.prob ?? 5.0;
  const exact10 = exactScoresList.find(s => s.home === 1 && s.away === 0)?.prob ?? 10.0;
  const exact01 = exactScoresList.find(s => s.home === 0 && s.away === 1)?.prob ?? 10.0;

  const over_05 = Number((100 - exact00).toFixed(1));
  const over_15 = Number((100 - (exact00 + exact10 + exact01)).toFixed(1));

  // First half goals approximation
  const ht_over_05 = Number((over_05 * 0.72).toFixed(1));
  const ht_over_15 = Number((over_15 * 0.45).toFixed(1));

  // Corners total lines
  const linesList = cornerProbs.lines || [];
  const total_lines = linesList.map(l => ({
    line: l.line,
    over: l.over_prob ?? l.probability ?? 50,
    under: l.under_prob ?? (100 - (l.over_prob ?? l.probability ?? 50))
  }));

  // Team corners calculated strictly via Poisson cumulative distribution
  const homeExp = cornerProbs.home_expected_corners;
  const awayExp = cornerProbs.away_expected_corners;

  // Poisson CDF helper: P(X > k) = 1 - Sum_{i=0}^k (lambda^i * e^-lambda / i!)
  const calculatePoissonOver = (lambda: number, line: number): number => {
    if (!lambda || lambda <= 0) return 0;
    let under = 0;
    const maxK = Math.floor(line);
    for (let i = 0; i <= maxK; i++) {
      let fact = 1;
      for (let f = 2; f <= i; f++) fact *= f;
      under += (Math.pow(lambda, i) * Math.exp(-lambda)) / fact;
    }
    return Number((Math.max(0, Math.min(100, (1 - under) * 100))).toFixed(1));
  };

  const home_over_35 = cornerProbs.hasRealData ? calculatePoissonOver(homeExp, 3.5) : 0;
  const home_over_45 = cornerProbs.hasRealData ? calculatePoissonOver(homeExp, 4.5) : 0;
  const away_over_35 = cornerProbs.hasRealData ? calculatePoissonOver(awayExp, 3.5) : 0;
  const away_over_45 = cornerProbs.hasRealData ? calculatePoissonOver(awayExp, 4.5) : 0;

  // Cards model: only compute if there is sufficient data quality; use genuine Poisson expectation
  const totalLambda = matchProbs.home_lambda + matchProbs.away_lambda;
  // Estimated match disciplinary intensity ~ 3.2 cards mean scaled with match competitiveness
  const estimatedCardsLambda = matchProbs.hasSufficientData ? Math.max(1.5, Math.min(6.5, 1.8 + totalLambda * 0.7)) : 0;
  const over_15_cards = estimatedCardsLambda > 0 ? calculatePoissonOver(estimatedCardsLambda, 1.5) : 0;
  const over_25_cards = estimatedCardsLambda > 0 ? calculatePoissonOver(estimatedCardsLambda, 2.5) : 0;

  // Combos
  const one_x_and_over_15 = Number(((one_x / 100) * (over_15 / 100) * 100).toFixed(1));
  const x_two_and_over_15 = Number(((x_two / 100) * (over_15 / 100) * 100).toFixed(1));

  return {
    double_chance: { one_x, x_two, one_two },
    goals_markets: {
      over_05,
      over_15,
      over_25: ou25_over,
      under_25: ou25_under,
      btts_yes,
      btts_no,
      ht_over_05,
      ht_over_15
    },
    corner_markets: {
      total_lines,
      home_over_35,
      home_over_45,
      away_over_35,
      away_over_45
    },
    card_markets: {
      over_15_cards,
      over_25_cards
    },
    combos: {
      one_x_and_over_15,
      x_two_and_over_15
    }
  };
}
