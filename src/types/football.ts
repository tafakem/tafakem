export interface Match {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  home_corners?: number;
  away_corners?: number;
  home_xg?: number;
  away_xg?: number;
  competition?: string;
  status?: 'live' | 'upcoming' | 'finished';
  minute?: string;
  local_time?: string;
  venue?: string;
}

export interface TeamStats {
  name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  home_matches: number;
  home_wins: number;
  home_draws: number;
  home_losses: number;
  home_goals_scored: number;
  home_goals_conceded: number;
  away_matches: number;
  away_wins: number;
  away_draws: number;
  away_losses: number;
  away_goals_scored: number;
  away_goals_conceded: number;
  corners_for: number;
  corners_against: number;
  xg_for: number;
  xg_against: number;
  form: string[];
}

export interface MatchProbabilityResult {
  home_win_prob: number;
  draw_prob: number;
  away_win_prob: number;
  home_lambda: number;
  away_lambda: number;
  correct_scores: { home: number; away: number; prob: number }[];
  exact_scores?: { home: number; away: number; prob: number }[];
  over_under: {
    over_05: number;
    under_05: number;
    over_15: number;
    under_15: number;
    over_25: number;
    under_25: number;
    over_35: number;
    under_35: number;
    ou15_over?: number;
    ou15_under?: number;
    ou25_over?: number;
    ou25_under?: number;
    ou35_over?: number;
    ou35_under?: number;
  };
  btts: {
    yes: number;
    no: number;
  };
  double_chance: {
    home_or_draw: number;
    home_or_away: number;
    draw_or_away: number;
  };
}

export interface CornerProbabilityResult {
  home_expected_corners: number;
  away_expected_corners: number;
  total_expected_corners: number;
  corners_over_85: number;
  corners_over_95: number;
  corners_over_105: number;
  lines?: { line: number; probability: number; over_prob?: number; under_prob?: number }[];
}
