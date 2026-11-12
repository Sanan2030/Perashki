export function storyPoints(hours) {
  if (!Number.isSafeInteger(hours) || hours < 1) {
    throw new RangeError('Müddət müsbət tam saat olmalıdır.');
  }
  return Number((hours < 8 ? hours / 10 : hours / 8).toFixed(2));
}

export function pointFormula(hours) {
  return `${hours} saat ${hours < 8 ? '× 0.1' : '÷ 8'} = ${storyPoints(hours)}`;
}

export function duration(hours) {
  return [Math.floor(hours / 8) && `${Math.floor(hours / 8)} gün`, hours % 8 && `${hours % 8} saat`]
    .filter(Boolean).join(' ');
}
