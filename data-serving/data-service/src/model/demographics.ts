import { Range } from './range';
import mongoose from 'mongoose';

export enum Sex {
    Female = 'Female',
    Male = 'Male',
    Other = 'Other',
}

export const demographicsSchema = new mongoose.Schema({
    ageRange: {
        start: {
            type: Number,
            min: 0,
            max: 120,
        },
        end: {
            type: Number,
            min: 0,
            max: 120,
        },
    },
    sex: {
        type: String,
        enum: Object.values(Sex),
    },
    // TODO: The below 3 fields should be data dictionaries.
    profession: {
        type: String,
        text: true,
    },
    nationalities: {
        type: [String],
        text: true,
    },
    ethnicity: {
        type: String,
        text: true,
    },
});

export type DemographicsDocument = mongoose.Document & {
    ageRange: Range<number>;
    sex: Sex;
    profession: string;
    nationalities: [string];
    ethnicity: string;
};
