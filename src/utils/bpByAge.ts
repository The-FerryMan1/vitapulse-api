interface VitalSigns {
    systolic: number | null | undefined;
    diastolic: number | null | undefined;
    pulse: number | null | undefined;
}

type Status = 'Normal' | 'High' | 'Low' | 'Invalid';

interface BpPulseResult {
    bpStatus: string;
    pulseStatus: Status;
    clinicalBpLabel: string;
    message?: string;
}

export const getBpAndPulseByAge = (
    systolic: number | null | undefined,
    diastolic: number | null | undefined,
    pulse: number | null | undefined,
    age: number | null | undefined
): BpPulseResult => {
    if (
        systolic == null || diastolic == null || pulse == null || age == null
    ) {
        return {
            bpStatus: 'Invalid',
            pulseStatus: 'Invalid',
            clinicalBpLabel: 'Invalid',
            message: 'Missing input data'
        };
    }

    // Corrected BP classification based on standard clinical guidelines
    const getClinicalBpLabel = (): string => {
        if (systolic < 90 || diastolic < 60) {
            return 'Low BP (Hypotension)';
        } else if (systolic >= 180 || diastolic >= 120) {
            return 'Hypertensive Crisis';
        } else if (systolic >= 140 || diastolic >= 90) {
            return 'Hypertension Stage 2';
        } else if (systolic >= 130 || diastolic >= 80) {
            return 'Hypertension Stage 1';
        } else if (systolic >= 120 && diastolic < 80) {
            return 'Elevated';
        } else if (systolic < 120 && diastolic < 80) {
            return 'Normal';
        } else {
            return 'Unclassified';
        }
    };

    // Pulse classification based on age
    const getPulseStatus = (): Status => {
        if (age <= 5) {
            if (pulse > 120) return 'High';
            if (pulse < 80) return 'Low';
        } else if (age <= 12) {
            if (pulse > 110) return 'High';
            if (pulse < 70) return 'Low';
        } else if (age <= 18) {
            if (pulse > 100) return 'High';
            if (pulse < 60) return 'Low';
        } else if (age <= 40) {
            if (pulse > 100) return 'High';
            if (pulse < 60) return 'Low';
        } else if (age <= 60) {
            if (pulse > 95) return 'High';
            if (pulse < 60) return 'Low';
        } else {
            if (pulse > 90) return 'High';
            if (pulse < 55) return 'Low';
        }
        return 'Normal';
    };

    const bpStatus = getClinicalBpLabel(); // Use the corrected BP classification
    const pulseStatus = getPulseStatus();

    return {
        bpStatus,
        pulseStatus,
        clinicalBpLabel: bpStatus,
        message: `BP: ${bpStatus}, Pulse: ${pulseStatus}`
    };
};