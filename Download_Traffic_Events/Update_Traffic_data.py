# Update_Traffic_data.py
# This is the main script to retrieve all the TRAFFIC events from TFEVT
# enabled sensors and save in CSV files
# NOTE: Files are tagged with the first part of the assetUid

from pathlib import Path
import requests
import json

from Download_Traffic_Events.CreateStartStopDates import start_stop_dates
from GET_TFEVT_by_assetUid import get_events
from Combine_TFEVT import aggregate_events


# function GET client token
def get_token_headers():
    url = "https://auth.aa.cityiq.io/oauth/token?grant_type=client_credentials"
    payload = {}
    headers_token = {
        'Authorization': 'Basic aWMuc3RhZ2Uuc2ltLmRldmVsb3A6ZGV2',
        'Authorization': 'Basic UHVibGljQWNjZXNzOnFQS0lhZEVzb0hqeWgyMjZTbno3'
    }
    response = requests.request("GET", url, headers=headers_token, data=payload)
    obj = json.loads(response.text)
    token = obj['access_token']

    headers = {
        'Authorization': 'Bearer ' + token,
        'Predix-Zone-Id': 'SD-IE-TRAFFIC'
    }
    return headers

# -------------------------------
# MAIN

# set up path
maindir_path = Path.cwd() / 'data'
resources_path = Path.cwd() / 'resources'

# Import list of sensors
assetFile = resources_path / 'Sensor_List.txt'
assetList = assetFile.read_text()
assetList = assetList.splitlines()
assetList = list(filter(None, assetList))  # remove blank lines

# GET client token and header needed for API
headers = get_token_headers()

# ------------------------------------------------
# loop through each asset
for assetUid in assetList:
    label = assetUid.split('-')[0]

    # Set start and stop times (we are UTC-7 if that helps)
    # The API times out for requests that span > 1 month so
    # we'll save each month separately
    dateList, startsArray, endtsArray = start_stop_dates(assetUid)

    # cycle through each month and save all events to a csv file in a 'raw' subdir
    get_events(assetUid, label, dateList, startsArray, endtsArray, headers)

    # concatenate raw files and aggregate so that we have one file for hourly
    # counts and one file for daily counts
    aggregate_events(label, dateList)