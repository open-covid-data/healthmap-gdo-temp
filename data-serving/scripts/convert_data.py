'''
Script to convert CSV line-list data into json compliant with the MongoDB
schema.
'''

import argparse
import csv
import logging
import json
import pandas as pd
import sys
from converters import (
    convert_demographics, convert_dictionary_field, convert_events,
    convert_imported_case, convert_location, convert_revision_metadata_field,
    convert_notes_field)
from pandas import DataFrame, Series
from typing import Any


def main():
    logging.basicConfig(filename='convert_data.log',
                        filemode='w', level=logging.DEBUG)

    parser = argparse.ArgumentParser(
        description='Convert CSV line-list data into json compliant with the '
        'MongoDB schema.')
    parser.add_argument('--infile', type=argparse.FileType('r'))
    parser.add_argument('--outfile',
                        nargs='?',
                        type=argparse.FileType('w', encoding='UTF-8'),
                        default=sys.stdout)
    parser.add_argument('--sample_rate', default=1.0, type=float)

    args = parser.parse_args()

    print('Reading data from', args.infile.name)
    original_cases = read_csv(args.infile)

    if args.sample_rate < 1.0:
        original_rows = original_cases.shape[0]
        original_cases = original_cases.sample(frac=args.sample_rate)
        print(
            f'Downsampling to {args.sample_rate*100}% of cases from '
            f'{original_rows} to {original_cases.shape[0]} rows')

    print('Converting data to new schema')
    converted_cases = convert(original_cases)

    print('Writing results to', args.outfile.name)
    write_json(converted_cases, args.outfile)

    print('Great success! 🎉')


def read_csv(infile: str) -> DataFrame:
    return pd.read_csv(infile, header=0, low_memory=False, encoding='utf-8')


def convert(df_import: DataFrame) -> DataFrame:
    # Operate on a separate output dataframe so we don't clobber or mutate the
    # original data.
    df_export = pd.DataFrame(columns={})

    # Generate new demographics column.
    df_export['demographics'] = df_import.apply(lambda x: convert_demographics(
        x['ID'], x['age'], x['sex']), axis=1)

    # Generate new location column.
    df_export['location'] = df_import.apply(
        lambda
        x:
        convert_location(
            x['ID'],
            x['country'],
            x['admin1'],
            x['admin2'],
            x['city'],
            x['latitude'],
            x['longitude']),
        axis=1)

    # Generate new events column.
    df_export['events'] = df_import.apply(
        lambda x: convert_events(x['ID'], {
            'onsetSymptoms': x['date_onset_symptoms'],
            'admissionHospital': x['date_admission_hospital'],
            'confirmed': x['date_confirmation'],
            'deathOrDischarge': x['date_death_or_discharge']
        }, x['outcome']), axis=1)

    # Generate new symptoms column.
    df_export['symptoms'] = df_import.apply(
        lambda x: convert_dictionary_field(
            x['ID'],
            'symptoms',
            x['symptoms']),
        axis=1)

    # Generate new chronic disease column.
    df_export['chronicDisease'] = df_import.apply(
        lambda x: convert_dictionary_field(
            x['ID'],
            'chronicDisease',
            x['chronic_disease']),
        axis=1)

    # Generate revision metadata.
    df_export['revisionMetadata'] = df_import.apply(
        lambda x: convert_revision_metadata_field(
            x['data_moderator_initials']
        ), axis=1)

    # Generate notes.
    df_export['notes'] = df_import.apply(lambda x: convert_notes_field(
        [x['notes_for_discussion'], x['additional_information']]), axis=1)

    # Archive the original fields.
    df_export['importedCase'] = df_import.apply(lambda x: convert_imported_case(
        x), axis=1)

    return df_export


def write_json(cases: DataFrame, outfile: str) -> None:
    json.dump([row.dropna().to_dict()
               for index, row in cases.iterrows()], outfile, indent=2)


if __name__ == '__main__':
    main()
