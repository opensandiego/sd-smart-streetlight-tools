# Combine_BICYCLE.py
# Concatenate BICYCLE files then aggregates bicycle
# counts into hourly and daily counts

from pathlib import Path
import pandas as pd


def aggregate_events(label, dateList):
    # create pathnames
    procdata_path = Path.cwd() / 'data' / label
    rawdata_path = Path.cwd() / 'data' / label / 'raw'

    # ---------------------------------
    # Loop through all months
    oneLoc_df = pd.DataFrame()
    for idx in range(len(dateList)):
        filename = 'BICYCLE_RAW_' + label + '_' + dateList[idx] + '.csv'
        obj_df = pd.read_csv(rawdata_path / filename)
        oneLoc_df = pd.concat([oneLoc_df, obj_df])
    # end of loop

    # Find and remove duplicate rows
    oneLoc_df = oneLoc_df[~oneLoc_df.duplicated(keep='first')]

    # convert timestamps to datetime values and use those as index
    oneLoc_df['datetimestamp'] = pd.to_datetime(oneLoc_df['timestamp'], unit='ms').\
        dt.tz_localize('UTC').dt.tz_convert('America/Los_Angeles')
    oneLoc_df.set_index('datetimestamp', inplace=True)

    # calculate per hour
    bicycle_count = oneLoc_df.bicycle_count.resample('H').sum()
    bicycle_counter_count = oneLoc_df.bicycle_counter_count.resample('H').sum()
    hourly_bicycle_count_df = pd.concat([bicycle_count, bicycle_counter_count], axis=1)

    # calculate per day
    daily_bicycle_count_df = hourly_bicycle_count_df.resample('D').sum()

    # save files
    update_file = procdata_path / 'update.txt'
    last_update = update_file.read_text()

    filename = 'Hourly_Bicycle_Count_' + label + '_through_' + last_update + '.csv'
    hourly_bicycle_count_df.to_csv(procdata_path / filename)

    filename = 'Daily_Bicycle_Count_' + label + '_through_' + last_update + '.csv'
    daily_bicycle_count_df.to_csv(procdata_path / filename)
