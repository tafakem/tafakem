export interface BettingAnalysisInput {
  estimatedProb: number; // e.g. 0.456 (between 0 and 1)
  decimalOdds: number; // e.g. 2.20 (> 1)
  hasRealOdds?: boolean; // verified bookmaker odds
  modelUncertainty?: number; // optional standard error
  sampleSize?: number; // number of historical matches in sample
  hasEmpiricalUncertaintyMethod?: boolean; // whether uncertainty is derived from validated empirical method
}

export interface BettingAnalysisResult {
  isValid: boolean;
  errorMessage?: string;
  estimatedProbPct: number; // e.g. 81.50
  equilibriumProbPct: number; // e.g. 55.56 (1 / odds * 100)
  probDiffPoints: number; // e.g. +25.94 (expressed in percentage points pp)
  decimalOdds: number;
  evDecimal: number; // e.g. +0.467
  evPercent: number; // e.g. +46.7
  expectedValue: number; // alias for evPercent
  evDisplay: string; // e.g. "+46.7%" or "N/D"
  classification:
    | 'EV POSITIVO VALIDADO — VENTAJA RESPALDADA'
    | 'EV POSITIVO — VENTAJA NO VALIDADA'
    | 'MARGEN NEUTRO — VENTAJA NO DEMOSTRADA'
    | 'EV NEGATIVO'
    | 'DATOS INSUFICIENTES — NO EVALUABLE';
  group: 'A' | 'B' | 'C';
  methodologicalNote: string;
  colorCode: 'green' | 'yellow' | 'red' | 'gray';
  lowerProbBoundPct?: number;
  conservativeEvPercent?: number;
}

export function analyzeBettingOpportunity(input: BettingAnalysisInput): BettingAnalysisResult {
  const {
    estimatedProb,
    decimalOdds,
    hasRealOdds = true,
    modelUncertainty,
    sampleSize = 0,
    hasEmpiricalUncertaintyMethod = false
  } = input;

  // Validation 1: Range checks on probability
  if (typeof estimatedProb !== 'number' || isNaN(estimatedProb) || estimatedProb < 0 || estimatedProb > 1) {
    return {
      isValid: false,
      errorMessage: 'Probabilidad fuera de rango (debe ser un valor decimal entre 0 y 1).',
      estimatedProbPct: 0,
      equilibriumProbPct: 0,
      probDiffPoints: 0,
      decimalOdds: typeof decimalOdds === 'number' && !isNaN(decimalOdds) ? decimalOdds : 0,
      evDecimal: 0,
      evPercent: 0,
      expectedValue: 0,
      evDisplay: 'N/D',
      classification: 'DATOS INSUFICIENTES — NO EVALUABLE',
      group: 'C',
      methodologicalNote: 'Probabilidad inválida o no calculable. No es posible evaluar.',
      colorCode: 'gray'
    };
  }

  // Validation 2: Range checks on odds
  if (typeof decimalOdds !== 'number' || isNaN(decimalOdds) || decimalOdds <= 1) {
    return {
      isValid: false,
      errorMessage: 'Cuota decimal inválida (debe ser estrictamente superior a 1.00).',
      estimatedProbPct: Number((estimatedProb * 100).toFixed(2)),
      equilibriumProbPct: 0,
      probDiffPoints: 0,
      decimalOdds: 0,
      evDecimal: 0,
      evPercent: 0,
      expectedValue: 0,
      evDisplay: 'N/D',
      classification: 'DATOS INSUFICIENTES — NO EVALUABLE',
      group: 'C',
      methodologicalNote: 'Cuota decimal ausente o menor/igual a 1.00. No es posible determinar el valor esperado.',
      colorCode: 'gray'
    };
  }

  // Validation 3: Essential data availability (real sample size)
  if (sampleSize < 5) {
    const eqProb = 1 / decimalOdds;
    const estPct = Number((estimatedProb * 100).toFixed(2));
    const eqPct = Number((eqProb * 100).toFixed(2));
    const diff = Number((estPct - eqPct).toFixed(2));
    return {
      isValid: false,
      errorMessage: 'Muestra histórica insuficiente (mínimo 5 partidos reales requeridos).',
      estimatedProbPct: estPct,
      equilibriumProbPct: eqPct,
      probDiffPoints: diff,
      decimalOdds,
      evDecimal: 0,
      evPercent: 0,
      expectedValue: 0,
      evDisplay: 'N/D',
      classification: 'DATOS INSUFICIENTES — NO EVALUABLE',
      group: 'C',
      methodologicalNote: `Datos insuficientes: muestra histórica de ${sampleSize} partidos (mínimo 5 requeridos). No es posible validar probabilidades ni valor esperado.`,
      colorCode: 'gray'
    };
  }

  // Validation 4: Verified bookmaker odds requirement
  if (!hasRealOdds) {
    const eqProb = 1 / decimalOdds;
    const estPct = Number((estimatedProb * 100).toFixed(2));
    const eqPct = Number((eqProb * 100).toFixed(2));
    const diff = Number((estPct - eqPct).toFixed(2));
    return {
      isValid: false,
      errorMessage: 'Sin cuotas reales verificadas de casas de apuestas.',
      estimatedProbPct: estPct,
      equilibriumProbPct: eqPct,
      probDiffPoints: diff,
      decimalOdds,
      evDecimal: 0,
      evPercent: 0,
      expectedValue: 0,
      evDisplay: 'N/D',
      classification: 'DATOS INSUFICIENTES — NO EVALUABLE',
      group: 'C',
      methodologicalNote: 'Sin cuota real verificada en casa de apuestas. No es posible determinar el valor esperado.',
      colorCode: 'gray'
    };
  }

  // Exact calculations maintaining full internal precision
  const estimatedProbPct = Number((estimatedProb * 100).toFixed(2));
  const equilibriumProb = 1 / decimalOdds;
  const equilibriumProbPct = Number((equilibriumProb * 100).toFixed(2));
  const probDiffPoints = Number((estimatedProbPct - equilibriumProbPct).toFixed(2));

  // Strict EV Formula: EV = (p * decimalOdds) - 1
  const evDecimal = (estimatedProb * decimalOdds) - 1;
  const evPercent = Number((evDecimal * 100).toFixed(2));
  const expectedValue = evPercent;
  const evDisplay = `${evPercent >= 0 ? '+' : ''}${evPercent.toFixed(1)}%`;

  let classification: BettingAnalysisResult['classification'] = 'MARGEN NEUTRO — VENTAJA NO DEMOSTRADA';
  let group: 'A' | 'B' | 'C' = 'C';
  let methodologicalNote = '';
  let colorCode: 'green' | 'yellow' | 'red' | 'gray' = 'yellow';
  let lowerProbBoundPct: number | undefined;
  let conservativeEvPercent: number | undefined;

  if (evDecimal < -0.01) {
    classification = 'EV NEGATIVO';
    group = 'C';
    methodologicalNote = `EV negativo (${evDisplay}): la cuota ofrecida (${decimalOdds}) no compensa la probabilidad estimada (${estimatedProbPct}%). Expectativa matemática desfavorable.`;
    colorCode = 'red';
  } else if (evDecimal >= -0.01 && evDecimal <= 0.02) {
    classification = 'MARGEN NEUTRO — VENTAJA NO DEMOSTRADA';
    group = 'C';
    methodologicalNote = `Margen neutro (${evDisplay}): la ventaja estimada (+${(evDecimal * 100).toFixed(1)}%) es inferior o igual al margen mínimo de variabilidad (+2%). Ventaja no demostrada.`;
    colorCode = 'yellow';
  } else {
    // EV > +0.02 (nominally positive EV)
    // Audited rule: Only classify as 'EV POSITIVO VALIDADO' if empirical uncertainty method is present and conservative lower bound > 0
    if (hasEmpiricalUncertaintyMethod && sampleSize >= 10) {
      const se = modelUncertainty !== undefined
        ? modelUncertainty
        : Math.sqrt((estimatedProb * (1 - estimatedProb)) / sampleSize);
      
      const lowerProbBound = Math.max(0, estimatedProb - 1.645 * se); // 90% confidence lower bound
      const conservativeEvDecimal = (lowerProbBound * decimalOdds) - 1;

      lowerProbBoundPct = Number((lowerProbBound * 100).toFixed(2));
      conservativeEvPercent = Number((conservativeEvDecimal * 100).toFixed(2));

      if (conservativeEvDecimal > 0) {
        classification = 'EV POSITIVO VALIDADO — VENTAJA RESPALDADA';
        group = 'B';
        methodologicalNote = `EV positivo validado: el límite inferior conservador de probabilidad (${lowerProbBoundPct}%) supera el umbral de equilibrio (${equilibriumProbPct}%), respaldando una ventaja matemática positiva superior a la incertidumbre.`;
        colorCode = 'green';
      } else {
        classification = 'MARGEN NEUTRO — VENTAJA NO DEMOSTRADA';
        group = 'C';
        methodologicalNote = `Ventaja no respaldada: el límite inferior conservador de probabilidad (${lowerProbBoundPct}%) no supera el umbral de equilibrio (${equilibriumProbPct}%). La incertidumbre muestral supera la ventaja estimada.`;
        colorCode = 'yellow';
      }
    } else {
      // No validated empirical uncertainty method or sample size < 10:
      // DO NOT invent confidence intervals or declare validated edge.
      classification = 'EV POSITIVO — VENTAJA NO VALIDADA';
      group = 'B';
      methodologicalNote = `EV positivo estimado (${evDisplay}), pero sin validación de incertidumbre empírica o muestra insuficiente (n = ${sampleSize}) para confirmar significancia estadística. Ventaja no validada.`;
      colorCode = 'yellow';
    }
  }

  // High probability market (Group A): only if probability >= 60% and valid sample
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
    colorCode,
    lowerProbBoundPct,
    conservativeEvPercent
  };
}
