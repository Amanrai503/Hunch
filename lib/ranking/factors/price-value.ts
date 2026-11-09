export function evaluatePriceValue(
  priceFinalCents: number,
  priceInitialCents: number,
  discountPercent: number,
  isFree: boolean,
  estimatedHours: number,
  budgetPreference: "budget" | "any" | "sales_only" = "any"
): {
  score: number;
  discountPercent: number;
  hourlyRateCents: number;
  summary: string;
} {
  if (isFree || priceFinalCents === 0) {
    return {
      score: 100,
      discountPercent: 100,
      hourlyRateCents: 0,
      summary: "Free to play; zero monetary barrier",
    };
  }

  // Hourly value calculation (cents per hour of estimated entertainment)
  const hours = Math.max(1, estimatedHours);
  const hourlyRateCents = Math.round(priceFinalCents / hours);

  // Hourly value score: <= $0.50/hr = 100, $1.00/hr = 85, $2.50/hr = 60, > $5.00/hr = 30
  let hourlyScore = 50;
  if (hourlyRateCents <= 50) {
    hourlyScore = 100;
  } else if (hourlyRateCents <= 100) {
    hourlyScore = 85;
  } else if (hourlyRateCents <= 250) {
    hourlyScore = 65;
  } else if (hourlyRateCents <= 500) {
    hourlyScore = 45;
  } else {
    hourlyScore = 25;
  }

  // Discount score: 0 to 100
  const discountScore = Math.min(100, discountPercent);

  // Blend: 55% discount depth + 45% hourly value
  let composite = 0.55 * discountScore + 0.45 * hourlyScore;

  // Apply user budget preference modifiers
  if (budgetPreference === "sales_only") {
    if (discountPercent === 0) {
      composite *= 0.4; // heavy penalty for full price when sales_only is desired
    }
  } else if (budgetPreference === "budget") {
    if (priceFinalCents <= 1500) {
      composite = Math.min(100, composite + 15);
    } else if (priceFinalCents > 3000) {
      composite *= 0.7;
    }
  }

  const score = Math.max(10, Math.min(100, Math.round(composite)));

  const formattedPrice = (priceFinalCents / 100).toFixed(2);
  const formattedHourly = (hourlyRateCents / 100).toFixed(2);

  let summary = `$${formattedPrice} ($${formattedHourly}/hr value)`;
  if (discountPercent > 0) {
    summary = `${discountPercent}% off at $${formattedPrice} ($${formattedHourly}/hr)`;
  }

  return {
    score,
    discountPercent,
    hourlyRateCents,
    summary,
  };
}
