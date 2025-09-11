export const googelSheetGetHelper = async (url: string) => {
    try {
        const res = await fetch(url, {
            method: "GET"
        });
        if (!res.ok) return {
            message: 'No data found'
        };
        const result = await res.text();
        if (!result) return { message: 'No data found' };

        const parts = result.trim().split(',');
        if (parts.length < 5) return { message: 'Invalid data format' };

        const [dateStr, legacyDateTimeStr, systolic, diastolic, pulseRate] = parts.map(p => p.trim());

        // Validate numeric fields
        const systolicNum = Number(systolic);
        const diastolicNum = Number(diastolic);
        const pulseRateNum = Number(pulseRate);
        if (isNaN(systolicNum) || isNaN(diastolicNum) || isNaN(pulseRateNum)) {
            return { message: 'Invalid numeric values' };
        }

        // Extract time from legacyDateTimeStr
        const timeMatch = legacyDateTimeStr.match(/\d{2}:\d{2}:\d{2}/);
        const timeStr = timeMatch ? timeMatch[0] : '00:00:00';

        // Parse dateStr: Try DD/MM/YYYY first, then full Date.toString() fallback
        let date: Date;
        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
            // Original DD/MM/YYYY logic
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10);
            const year = parseInt(dateParts[2], 10);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900) {
                date = new Date(year, month - 1, day); // Create base date
                const [hours, minutes, seconds] = timeStr.split(':').map(Number);
                date.setHours(hours, minutes, seconds, 0); // Add time
                date.setHours(date.getHours() + 8); // Apply +08:00 offset (shifts to UTC)
            } else {
                return { message: 'Invalid date values in DD/MM/YYYY format' };
            }
        } else {
            // Fallback: Parse full Date.toString() format (handles your example)
            date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                // Try without the parenthetical timezone description (common variation)
                const withoutParens = dateStr.replace(/\s*\([^)]*\)$/, '');
                date = new Date(withoutParens);
                if (isNaN(date.getTime())) {
                    return { message: 'Invalid date format (unrecognized string)' };
                }
            }
            // Override time from legacyDateTimeStr if present
            const [hours, minutes, seconds] = timeStr.split(':').map(Number);
            date.setHours(hours, minutes, seconds, 0);
            // Adjust for +08:00 if not already in the string (your example already has it)
            if (!dateStr.includes('+0800')) {
                date.setHours(date.getHours() + 8);
            }
        }

        if (isNaN(date.getTime())) {
            return { message: 'Invalid date (out of range)' };
        }

        return {
            date: date.toISOString(),
            systolic: systolicNum,
            diastolic: diastolicNum,
            pulseRate: pulseRateNum,
        };
    } catch (error) {
        console.error('Google Sheet fetch error:', error);
        return {
            message: 'Internal service error'
        };
    }
}