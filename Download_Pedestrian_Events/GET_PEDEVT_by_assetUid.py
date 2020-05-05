# GET_PEDEVT_by_assetUid.py
# This function retrieves all the PEDEVT events from a user-created list of sensors
# and saves in CSV files. The API times out if you try to retrieve all the data at once,
# so data from each month is saved in separate files to be combined later

from pathlib import Path
import requests
import json
import pandas as pd

def get_events(assetUid, label, dateList, startsArray, endtsArray, headers):
    rawdata_path = Path.cwd() / 'data' / label / 'raw'

    # --------------------------
    # get latitude/longitude
    url = "https://sandiego.cityiq.io/api/v2/metadata/assets/" + assetUid
    payload = {}
    response = requests.request("GET", url, headers=headers, data=payload)

    txt = response.text    # extract json data to dictionary in string form
    obj = json.loads(txt)  # convert json dictionary string to python dictionary
    oneLat = obj['coordinates'].split(':')[0]   # extract coordinates
    oneLong = obj['coordinates'].split(':')[1]

    # -------------------------------
    # loop through each month
    for idx in range(len(startsArray)):
        # there should be 89,280 packages per month, so set page size greater than that
        url = "https://sandiego.cityiq.io/api/v2/event/assets/" + \
              assetUid + "/events?eventType=PEDEVT&startTime=" + str(int(startsArray[idx])) + \
              "&endTime=" + str(int(endtsArray[idx])) + "&pageSize=100000"
        payload = {}
        response = requests.request("GET", url, headers=headers, data=payload)

        txt = response.text     # extract json data to dictionary in string form
        obj = json.loads(txt)   # convert json dictionary string to python dictionary
        obj_df = pd.DataFrame.from_dict(obj['content'])  # convert dictionary to dataframe

        # add columns to new dataframe unless it is empty
        try:
            oneLoc_df = obj_df[['locationUid', 'assetUid', 'timestamp']].copy()
            oneLoc_df['latitude'] = oneLat
            oneLoc_df['longitude'] = oneLong
            oneLoc_df['speed_unit'] = [d.get('speedUnit') for d in obj_df.properties]
            oneLoc_df['direction_unit'] = [d.get('directionUnit') for d in obj_df.properties]
            oneLoc_df['eventUid'] = [d.get('eventUid') for d in obj_df.properties]
            oneLoc_df['pedestrian_count'] = [d.get('pedestrianCount') for d in obj_df.measures]
            oneLoc_df['pedestrian_speed'] = [d.get('speed') for d in obj_df.measures]
            oneLoc_df['pedestrian_direction'] = [d.get('direction') for d in obj_df.measures]
            oneLoc_df['pedestrian_counter_count'] = [d.get('counter_direction_pedestrianCount') for d in obj_df.measures]
            oneLoc_df['pedestrian_counter_speed'] = [d.get('counter_direction_speed') for d in obj_df.measures]
            oneLoc_df['pedestrian_counter_direction'] = [d.get('direction') for d in obj_df.measures]

            # save this (one sensor) dataframe to CSV file
            filename = 'PEDEVT_RAW_' + label + '_' + dateList[idx] + '.csv'
            oneLoc_df.to_csv(rawdata_path / filename, index=False)
        # if empty, move on to the next month
        except:
            continue
