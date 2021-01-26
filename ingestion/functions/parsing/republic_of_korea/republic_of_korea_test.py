import os
import unittest
from republic_of_korea import republic_of_korea

_SOURCE_ID = "placeholder_ID"
_SOURCE_URL = "placeholder_URL"


class RepublicOfKoreaTest(unittest.TestCase):
    def setUp(self):
        self.maxDiff = 15000

    def test_parse(self):
        '''
        '''
        current_dir = os.path.dirname(__file__)
        sample_data_file = os.path.join(current_dir, "sample_data.csv")

        result = republic_of_korea.parse_cases(
            sample_data_file, _SOURCE_ID, _SOURCE_URL)
        self.assertCountEqual(list(result),
                              [{'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '1',
                                                  'sourceUrl': 'placeholder_URL'},
                                'location': {'query': 'South Korea'},
                                'events': [{'name': 'confirmed',
                                            'dateRange': {'start': '01/20/2020Z', 'end': '01/20/2020Z'}},
                                           {'name': 'outcome',
                                            'value': 'Recovered',
                                            'dateRange': {'start': '02/06/2020Z', 'end': '02/06/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 36.0, 'end': 37.0},
                                                   'gender': 'Female'},
                                  'travelHistory': {'traveledPrior30Days': True,
                                                    'travel': [{'location': {'query': 'China'}}]},
                                'notes': 'Case infection order is 1.0, Case contact number was 45.0, Infection reason is given as visit to Wuhan, Exposure was between 01/19/2020 and 01/19/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '2',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/24/2020Z', 'end': '01/24/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '02/05/2020Z', 'end': '02/05/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 56.0, 'end': 57.0}, 'gender': 'Male'},
                                  'travelHistory': {'traveledPrior30Days': True},
                                  'notes': 'Case infection order is 1.0, Case contact number was 75.0, Infection reason is given as visit to Wuhan, Exposure was between 01/22/2020 and 01/22/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '3',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Seoul, South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/26/2020Z', 'end': '01/26/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '02/12/2020Z', 'end': '02/12/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 54.0, 'end': 55.0}, 'gender': 'Male'},
                                  'notes': 'Case infection order is 1.0, Case contact number was 16.0, Infection reason is given as visit to Wuhan, Exposure was between 01/20/2020 and 01/20/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '4',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Seoul, South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/27/2020Z', 'end': '01/27/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '02/09/2020Z', 'end': '02/09/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 56.0, 'end': 57.0}, 'gender': 'Male'},
                                  'notes': 'Case infection order is 1.0, Case contact number was 95.0, Infection reason is given as visit to Wuhan, Exposure was between 01/20/2020 and 01/20/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '5',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Seoul, South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/30/2020Z', 'end': '01/30/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '03/02/2020Z', 'end': '03/02/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 33.0, 'end': 34.0}, 'gender': 'Male'},
                                  'notes': 'Case infection order is 1.0, Case contact number was 31.0, Infection reason is given as visit to Wuhan, Exposure was between 01/24/2020 and 01/24/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '6',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Seoul, South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/30/2020Z', 'end': '01/30/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '02/19/2020Z', 'end': '02/19/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 56.0, 'end': 57.0}, 'gender': 'Male'},
                                  'transmission': {'linkedCaseIDs': [3]},
                                  'notes': 'Case infection order is 2.0, Case was infected by case ID 3, Case contact number was 17.0, Infection reason is given as contact with patient, Exposure was between 01/26/2020 and 01/26/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '7',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Seoul, South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/30/2020Z', 'end': '01/30/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '02/15/2020Z', 'end': '02/15/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 29.0, 'end': 30.0}, 'gender': 'Male'},
                                  'notes': 'Case infection order is 1.0, Case contact number was 9.0, Infection reason is given as visit to Wuhan, Exposure was between 01/23/2020 and 01/23/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '8',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Jeollabuk-do, South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/31/2020Z', 'end': '01/31/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '02/12/2020Z', 'end': '02/12/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 63.0, 'end': 64.0},
                                                   'gender': 'Female'},
                                  'notes': 'Case infection order is 1.0, Case contact number was 113.0, Infection reason is given as visit to Wuhan, Exposure was between 01/23/2020 and 01/23/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '9',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Seoul, South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/31/2020Z', 'end': '01/31/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '02/24/2020Z', 'end': '02/24/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 28.0, 'end': 29.0},
                                                   'gender': 'Female'},
                                  'transmission': {'linkedCaseIDs': [5]},
                                  'notes': 'Case infection order is 2.0, Case was infected by case ID 5, Case contact number was 2.0, Infection reason is given as contact with patient, Exposure was between 01/30/2020 and 01/30/2020'},
                               {'caseReference': {'sourceId': 'placeholder_ID',
                                                  'sourceEntryId': '10',
                                                  'sourceUrl': 'placeholder_URL'},
                                  'location': {'query': 'Seoul, South Korea'},
                                  'events': [{'name': 'confirmed',
                                              'dateRange': {'start': '01/31/2020Z', 'end': '01/31/2020Z'}},
                                             {'name': 'outcome',
                                              'value': 'Recovered',
                                              'dateRange': {'start': '02/19/2020Z', 'end': '02/19/2020Z'}}],
                                  'demographics': {'ageRange': {'start': 54.0, 'end': 55.0},
                                                   'gender': 'Female'},
                                  'transmission': {'linkedCaseIDs': [6]},
                                  'notes': 'Case infection order is 3.0, Case was infected by case ID 6, Case contact number was 43.0, Infection reason is given as contact with patient, Exposure was between 01/30/2020 and 01/30/2020'}])