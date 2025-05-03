interface Readings {
    diastolic: number,
    id: number,
    status: string,
    systolic: number,
    bpStatus: string,
    pulseStatus: string,
    pulse: number,
    message: string,
    timestamp: string,
};

interface analyzedData {
    avgSys: number,
    avgDias: number,
    avgPulse: number,
    condition: string,
}

export const anlyzeForAbnormalities = (data: Readings[], age: number)=>{
    if (!data || data.length === 0 || !age) {
        return { message: 'No data to calculate.' };
    }

    const totalBpHigh = data.reduce((count, item) => item.bpStatus === 'High' ? count + 1 : count, 0);
    const totalBpLow = data.reduce((count, item) => item.bpStatus === 'Low' ? count + 1 : count, 0);
    const totalPulseHigh = data.reduce((count, item) => item.pulseStatus === 'High' ? count + 1 : count, 0);
    const totalPulseLow = data.reduce((count, item) => item.pulseStatus === 'Low' ? count + 1 : count, 0);

    return {
        highBp: totalBpHigh,
        lowBp: totalBpLow,
        highPulse: totalPulseHigh,
        lowPulse: totalPulseLow,
    }

    
};



// Category	Systolic(mmHg)	Diastolic(mmHg)
// Normal < 120 < 80
// Elevated	120–129 < 80
// Hypertension Stage 1	130–139	80–89
// Hypertension Stage 2	≥140	≥90
// Hypertensive Crisis	≥180	≥120