export function isValidIndex(index: number, arrayLength: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < arrayLength;
}
