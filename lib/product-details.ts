export function separateMeasurements(details: [string, string][]) {
  const measurements: string[] = [];
  const specifications: [string, string][] = [];
  for (const [label, value] of details) {
    if (/^(?:measurements?|dimensions?|size)$/i.test(label.trim())) {
      if (value.trim()) measurements.push(value.trim());
    } else {
      specifications.push([label, value]);
    }
  }
  return { measurements, specifications };
}
