# CreateStartStopDates.py
# This function figures out the date of the last data download,
# and returns the date lists needed to to get events from the
# last download to yesterday. If more than a month has passed
# since the last download, saves the intermediate events to separate
# month files

from pathlib import Path
import datetime as dt
from datetime import date, timedelta
import pandas as pd

def start_stop_dates(assetUid):
    # If there is an 'update.txt' file in the data directory,
    # it contains the date of the previous update. If that file
    # doesn't exist, assume we're collecting events from the beginning
    # of the stream history. Also create data directories if they
    # don't exist
    label = assetUid.split('-')[0]
    filepath = Path.cwd() / 'data' / label
    update_file = filepath / 'update.txt'

    if filepath.exists():
        # do stuff from previous date to now
        if update_file.exists():
            last_update = update_file.read_text()
            last_updatetime = dt.datetime.strptime(last_update, '%m-%d-%Y')
        else:
            last_updatetime = dt.datetime.strptime('08-01-2019', '%m-%d-%Y')
    else:
        # make this new directory and the raw subdirectory
        Path(filepath).mkdir()
        Path(filepath / 'raw').mkdir()
        # start from earliest possible date (for TFEVT)
        last_updatetime = dt.datetime.strptime('10-01-2019', '%m-%d-%Y')

    # ------------
    # create start and stop dates
    start_datetime = last_updatetime.replace(day=1)
    yesterday = date.today() - timedelta(days=1)
    end_of_day_time = dt.datetime.max.time()
    yesterday_datetime = dt.datetime.combine(yesterday, end_of_day_time)

    # create labels for rawdata files
    dateList = pd.date_range(start=start_datetime, end=yesterday_datetime,
                             freq='MS').strftime("%Y-%m").to_list()

    # ------
    # get start times in ms
    startDateArray = pd.date_range(start=start_datetime,
                                   end=yesterday_datetime, freq='MS',
                                   tz='America/Los_Angeles').to_list()
    startsArray = [int(x.timestamp() * 1000) for x in startDateArray]

    # ------
    # get end times in ms
    endDateArray = pd.date_range(start=start_datetime,
                                 end=yesterday_datetime, freq='M',
                                 tz='America/Los_Angeles').to_list()
    # move time of each date to 23:59:59
    endDateArray = [x + timedelta(seconds=86399) for x in endDateArray]
    # because endDateArray will stop at *previous* month
    endDateArray.append(yesterday_datetime)
    endtsArray = [int(x.timestamp() * 1000) for x in endDateArray]

    # ------
    # write new download date (yesterday) to 'update.txt'
    update_file.write_text(yesterday.strftime("%m-%d-%Y"))

    return dateList, startsArray, endtsArray
