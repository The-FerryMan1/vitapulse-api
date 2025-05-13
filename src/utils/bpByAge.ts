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
        if (systolic === 254 || systolic === 255 || diastolic === 254 || diastolic === 255) {
            return 'Error';
        }

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


    const getBpbyAge = () => {
        if (systolic === 254 || systolic === 255 || diastolic === 254 || diastolic === 255) {
            return 'Error';
        }
        if (age >= 1 && age <= 13) {
            if (systolic < 90 || diastolic < 55) return 'Low BP (Hypotension)';
            if (systolic > 120 || diastolic > 80) return 'High BP (Hypertension)';
            return 'Normal';
        }

        // TEENS (14–18 years)
        if (age >= 14 && age <= 18) {
            if (systolic < 90 || diastolic < 60) return 'Low BP (Hypotension)';
            if (systolic > 130 || diastolic > 85) return 'High BP (Hypertension)';
            return 'Normal';
        }

        // YOUNG & MIDDLE-AGED ADULTS (19–59 years)
        if (age >= 19 && age <= 59) {
            if (systolic < 95 || diastolic < 60) return 'Low BP (Hypotension)';
            if (systolic >= 180 || diastolic >= 120) return 'Hypertensive Crisis';
            if (systolic >= 140 || diastolic >= 90) return 'Hypertension Stage 2';
            if (systolic >= 130 || diastolic >= 80) return 'Hypertension Stage 1';
            if (systolic >= 120 && diastolic < 80) return 'Elevated';
            if (systolic < 120 && diastolic < 80) return 'Normal';
            return 'Unclassified';
        }

        // OLDER ADULTS (60+ years)
        if (age >= 60) {
            if (systolic < 100 || diastolic < 60) return 'Low BP (Hypotension)';
            if (systolic >= 180 || diastolic >= 120) return 'Hypertensive Crisis';
            if (systolic >= 150 || diastolic >= 90) return 'Hypertension (Common in elderly)';
            if (systolic >= 130 || diastolic >= 80) return 'Elevated / Pre-Hypertension';
            if (systolic < 130 && diastolic < 80) return 'Normal';
            return 'Unclassified';
        }

        // If age is not in a valid range
        return 'Invalid';
    }

    // Pulse classification based on age
    const getPulseStatus = (): Status => {
        if (age >= 1 && age <= 3) { // Toddler
            if (pulse < 80) return 'Low';
            if (pulse > 150) return 'High';
            return 'Normal';
        } else if (age >= 4 && age <= 5) { // Preschool
            if (pulse < 70) return 'Low';
            if (pulse > 140) return 'High';
            return 'Normal';
        } else if (age >= 6 && age <= 12) { // School-age
            if (pulse < 60) return 'Low';
            if (pulse > 120) return 'High';
            return 'Normal';
        } else if (age >= 13 && age <= 18) { // Teen
            if (pulse < 50) return 'Low';
            if (pulse > 100) return 'High';
            return 'Normal';
        } else if (age >= 19 && age <= 60) { // Adult
            if (pulse < 60) return 'Low';
            if (pulse > 100) return 'High';
            return 'Normal';
        } else if (age > 60) { // Older Adult
            if (pulse < 60) return 'Low';
            if (pulse > 100) return 'High';
            return 'Normal';
        } else {
            return 'Invalid';
        }
    };

    const bpStatus = getBpbyAge(); 
    const clinicallabel = getClinicalBpLabel()
    const pulseStatus = getPulseStatus();

    return {
        bpStatus,
        pulseStatus,
        clinicalBpLabel: clinicallabel,
        message: `BP: ${bpStatus}, Pulse: ${pulseStatus}`
    };
};