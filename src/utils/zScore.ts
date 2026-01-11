type resultWithPpAndMap ={

    id: number;
    diastolic: number;
    systolic: number;
    bpStatus: string;
    pulseStatus: string;
    pulse: number;
    timestamp: string;
}[]

export const calculateZScores = (data: resultWithPpAndMap) => {
    if (data.length === 0) return [];
    
    const keys: (keyof typeof data[number])[] = ['systolic', 'diastolic', 'pulse'];
    const n = data.length;
    
    // Precompute means
    const means: Record<string, number> = {};
    keys.forEach(key => {
        means[key] = data.reduce((sum, item) => sum + (item[key] as number), 0) / n;
    });
    
    // Precompute variances
    const variances: Record<string, number> = {};
    keys.forEach(key => {
        const mean = means[key];
        variances[key] = data.reduce((sum, item) => sum + Math.pow((item[key] as number) - mean, 2), 0) / n;
    });
    
    const zScores = data.map((entry) => {
        const result: any = { ...entry };
        keys.forEach((key) => {
            const mean = means[key];
            const stdDev = Math.sqrt(variances[key]);
            result[`${key}Z`] = stdDev === 0 ? 0 : parseFloat(((entry[key] as number - mean) / stdDev).toFixed(2));
        });
        return result;
    });

    return zScores;
};
