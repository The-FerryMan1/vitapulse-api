/**
 * Date filtering utility for BP readings
 */

export type DateFilter = 'all' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface DateRange {
  startTime: Date | null;
  endTime: Date | null;
}

/**
 * Calculates date range based on filter type
 * @param filter - Filter type (all, hourly, daily, weekly, monthly, custom)
 * @param fromQuery - Start date for custom filter (ISO string)
 * @param toQuery - End date for custom filter (ISO string)
 * @returns Date range with startTime and endTime, or null for 'all' filter
 */
export function calculateDateRange(
  filter: DateFilter,
  fromQuery?: string | null,
  toQuery?: string | null
): DateRange | null {
  if (filter === 'all') {
    return null;
  }

  const now = new Date();
  let startTime: Date;
  let endTime: Date = now;

  switch (filter) {
    case 'hourly':
      startTime = new Date(now.toISOString());
      startTime.setUTCMinutes(0, 0, 0);
      endTime = new Date(startTime);
      endTime.setUTCHours(endTime.getUTCHours() + 1, 0, 0, 0);
      break;

    case 'daily':
      startTime = new Date(now.toISOString().split('T')[0] + 'T00:00:00.000Z');
      endTime = new Date(now.toISOString().split('T')[0] + 'T23:59:59.999Z');
      break;

    case 'weekly':
      startTime = new Date(now.toISOString());
      startTime.setUTCDate(now.getUTCDate() - now.getUTCDay());
      startTime.setUTCHours(0, 0, 0, 0);
      endTime = new Date(startTime);
      endTime.setUTCDate(endTime.getUTCDate() + 6);
      endTime.setUTCHours(23, 59, 59, 999);
      break;

    case 'monthly':
      startTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      endTime = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
      );
      break;

    case 'custom':
      if (!fromQuery || !toQuery) {
        throw new Error('Custom filter requires "from" and "to" query params');
      }
      startTime = new Date(fromQuery);
      endTime = new Date(toQuery);
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error('Invalid "from" or "to" date format');
      }
      break;

    default:
      throw new Error('Invalid filter option');
  }

  return { startTime, endTime };
}
