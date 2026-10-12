export interface BettingAnalysisInput {
  estimatedProb: number; // e.g. 0.456 (between 0 and 1)
  decimalOdds: number; // e.g. 2.20 (> 1)
  modelUncertainty?: number; // e.g. 0.03 (3% standard error)
  sampleSize?: number; // number of historical matches in sample
}

export interface BettingAnalysisResult {
  isValid: boolean;
  errorMessage?: string;
  estimatedProbPct: number; // e.g. 45.6
  equilibriumProbPct: number; // e.g. 45.45
  probDiffPoints: number; // e.g. +0.15
  decimalOdds: number;
  evDecimal: number; // e.g. 0.0032
  evPercent: number; // e.g. +0.32%
  expectedValue: number; // alias for evPercent
  evDisplay: string; // e.g. "+0.3%"
  classification: 'EV NEGATIVO' | 'MARGEN NEUTRO — VENTAJA NO DEMOSTRADA' | 'EV POSITIVO — VENTAJA POTENCIAL' | 'EV POSITIVO VALIDADO — VENTAJA RESPALDADA' | 'DATOS INSUFICIENTES — NO EVALUABLE';
  group: 'A' | 'B' | 'C';
  methodologicalNote: string;
  colorCode: 'green' | 'yellow' | 'red' | 'gray';
}

export function analyzeBettingOpportunity(input: BettingAnalysisInput): BettingAnalysisResult {
  const { estimatedProb, decimalOdds, modelUncertainty = 0.04, sampleSize = 10 } = input;

  // Validations
  if (estimatedProb < 0 || estimatedProb > 1) {
    return {
      isValid: false,
      errorMessage: 'Probabilidad inválida (debe estar entre 0 y 1).',
      estimatedProbPct: 0,
      equilibriumProbPct: 0,
      probDiffPoints: 0,
      decimalOdds,
      evDecimal: 0,
      evPercent: 0,
      expectedValue: 0,
      evDisplay: 'N/D',
      classification: 'DATOS INSUFICIENTES — NO EVALUABLE',
      group: 'C',
      methodologicalNote: 'Datos insuficientes: no existe una muestra adecuada para estimar la probabilidad.',
      colorCode: 'gray'
    };
  }

  if (decimalOdds <= 1) {
    return {
      isValid: false,
      errorMessage: 'Cuota inválida (debe ser estrictamente superior a 1).',
      estimatedProbPct: Number((estimatedProb * 100).toFixed(2)),
      equilibriumProbPct: 0,
      probDiffPoints: 0,
      decimalOdds,
      evDecimal: 0,
      evPercent: 0,
      expectedValue: 0,
      evDisplay: 'N/D',
      classification: 'DATOS INSUFICIENTES — NO EVALUABLE',
      group: 'C',
      methodologicalNote: 'Cuota inválida o menor/igual a 1.',
      colorCode: 'gray'
    };
  }

  if (sampleSize < 5) {
    return {
      isValid: false,
      errorMessage: 'Muestra de datos insuficiente.',
      estimatedProbPct: Number((estimatedProb * 100).toFixed(2)),
      equilibriumProbPct: Number(((1 / decimalOdds) * 100).toFixed(2)),
      probDiffPoints: 0,
      decimalOdds,
      evDecimal: 0,
      evPercent: 0,
      expectedValue: 0,
      evDisplay: 'N/D',
      classification: 'DATOS INSUFICIENTES — NO EVALUABLE',
      group: 'C',
      methodologicalNote: 'Datos insuficientes: no existe una muestra adecuada para estimar la probabilidad.',
      colorCode: 'gray'
    };
  }

  // Calculations with full internal precision
  const estimatedProbPct = Number((estimatedProb * 100).toFixed(2));
  const equilibriumProb = 1 / decimalOdds;
  const equilibriumProbPct = Number((equilibriumProb * 100).toFixed(2));
  const probDiffPoints = Number((estimatedProbPct - equilibriumProbPct).toFixed(2));

  // EV Formula: EV = (p * decimalOdds) - 1
  const evDecimal = (estimatedProb * decimalOdds) - 1;
  const evPercent = evDecimal * 100;
  const expectedValue = evPercent;
  const evDisplay = `${evPercent >= 0 ? '+' : ''}${evPercent.toFixed(1)}%`;

  // Conservative lower bound of probability considering uncertainty
  const lowerProbBound = Math.max(0, estimatedProb - modelUncertainty);
  const conservativeEvDecimal = (lowerProbBound * decimalOdds) - 1;

  let classification: BettingAnalysisResult['classification'] = 'MARGEN NEUTRO — VENTAJA NO DEMOSTRADA';
  let group: 'A' | 'B' | 'C' = 'C';
  let methodologicalNote = '';
  let colorCode: 'green' | 'yellow' | 'red' | 'gray' = 'yellow';

  if (evDecimal < -0.01) {
    classification = 'EV NEGATIVO';
    group = 'C';
    methodologicalNote = 'EV negativo: la cuota no compensa la probabilidad estimada.';
    colorCode = 'red';
  } else if (evDecimal >= -0.01 && evDecimal <= 0.02) {
    classification = 'MARGEN NEUTRO — VENTAJA NO DEMOSTRADA';
    group = 'C';
    methodologicalNote = 'Margen neutro: la ventaja estimada es inferior a la incertidumbre del modelo.';
    colorCode = 'yellow';
  } else {
    // EV is positive (> +2%)
    if (conservativeEvDecimal > 0) {
      classification = 'EV POSITIVO VALIDADO — VENTAJA RESPALDADA';
      group = 'B';
      methodologicalNote = 'EV positivo y validado: el límite inferior conservador confirma la ventaja estadística.';
      colorCode = 'green';
    } else {
      classification = 'EV POSITIVO — VENTAJA POTENCIAL';
      group = 'B';
      methodologicalNote = 'EV positivo, pero la incertidumbre del modelo no permite confirmar plenamente la ventaja.';
      colorCode = 'yellow';
    }
  }

  // If estimated probability is very high (>= 60%), also ensure it appears in Group A (Highest probability)
  if (estimatedProb >= 0.60 && group === 'C') {
    group = 'A';
  }

  return {
    isValid: true,
    estimatedProbPct,
    equilibriumProbPct,
    probDiffPoints,
    decimalOdds,
    evDecimal,
    evPercent,
    expectedValue,
    evDisplay,
    classification,
    group,
    methodologicalNote,
    colorCode
  };
}
