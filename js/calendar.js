const IGBO_MARKET_DAYS = ['Eke', 'Orie', 'Afọ', 'Nkwọ'];

const REFERENCE_DATE = '2026-10-25';
const REFERENCE_MARKET_INDEX = 2;

function getMarketDay(dateString) {
  const reference = new Date(REFERENCE_DATE + 'T12:00:00');
  const chosen = new Date(dateString + 'T12:00:00');

  if (isNaN(chosen.getTime())) {
    return 'Invalid date';
  }

  const difference = Math.round(
    (chosen - reference) / 86400000
  );

  const index = (
    (REFERENCE_MARKET_INDEX + difference) % 4 + 4
  ) % 4;

  return IGBO_MARKET_DAYS[index];
}

function showMarketDays() {
  return IGBO_MARKET_DAYS.join(' → ');
}
