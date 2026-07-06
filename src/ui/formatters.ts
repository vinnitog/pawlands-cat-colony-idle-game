import { resourceLabels, specialItemLabels, type Inventory, type Resources } from '../game/models/resources.ts';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return `${hours}h ${restMinutes}min`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatLongDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export function formatResourceList(resources: Partial<Resources>): string {
  return Object.entries(resources)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([key, amount]) => `${amount} ${resourceLabels[key as keyof Resources]}`)
    .join(', ');
}

export function getInventoryLabel(key: keyof Inventory): string {
  return specialItemLabels[key];
}
