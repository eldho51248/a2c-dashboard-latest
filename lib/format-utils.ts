/**
 * Utility functions for formatting numbers, decimals, and percentages
 */

export function formatNumber(num: number | undefined | null): string {
    if (num === undefined || num === null || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US').format(Math.round(num));
}

export function formatDecimal(num: number | undefined | null, decimals: number = 2): string {
    if (num === undefined || num === null || isNaN(num)) return '0.00';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
}

export function formatPercentage(num: number | undefined | null, decimals: number = 1): string {
    if (num === undefined || num === null || isNaN(num)) return '0%';
    return `${formatDecimal(num, decimals)}%`;
}

export function formatCompactNumber(num: number | undefined | null): string {
    if (num === undefined || num === null || isNaN(num)) return '0';

    if (num >= 1000000) {
        return `${formatDecimal(num / 1000000, 1)}M`;
    } else if (num >= 1000) {
        return `${formatDecimal(num / 1000, 1)}K`;
    }

    return formatNumber(num);
}

// Helper to display numbers in a readable format
export function displayNumber(num: number | undefined | null): string {
    return formatNumber(num);
}
