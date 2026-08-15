// Utility function to filter out Unknown/empty categories from chart data
export function filterChartData<T extends Record<string, any>>(
    data: T[],
    excludeKeys: string[] = ['Unknown', 'unknown']
): T[] {
    return data.filter(item => {
        // Check if this is an "Unknown" category
        const isUnknown = excludeKeys.some(key =>
            Object.values(item).some(val =>
                typeof val === 'string' && val.toLowerCase() === key.toLowerCase()
            )
        );

        if (!isUnknown) return true;

        // If it's Unknown, only include if it has non-zero values
        const hasNonZeroValue = Object.entries(item).some(([key, value]) => {
            if (key.toLowerCase().includes('name') || key.toLowerCase().includes('group')) {
                return false; // Skip name/label fields
            }
            return typeof value === 'number' && value > 0;
        });

        return hasNonZeroValue;
    });
}

// Filter function specifically for age/gender data
export function filterAgeGenderData(data: any[]) {
    return data.map(ageGroup => {
        const filtered = { ...ageGroup };

        // Remove unknown gender if it's 0
        if (filtered.unknown === 0 || filtered.Unknown === 0) {
            delete filtered.unknown;
            delete filtered.Unknown;
        }

        return filtered;
    }).filter(item => {
        // Keep age group if it has any non-zero values
        const hasData = (item.male > 0) || (item.female > 0) || (item.unknown > 0) || (item.Unknown > 0);
        return hasData;
    });
}
