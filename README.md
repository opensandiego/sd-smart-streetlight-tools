# sd-smart-streetlight-tools

**NOTICE (8/11/2020)** *This project is on hiatus as the City works out how to implement its contract with new CityIQ owner Ubicquia. Until then, data from the smart streetlights is not available.*


The City of San Diego has installed over 2,000 "intelligent sensors" in streetlights across the entire city. The hope is to leverage the data from these sensors to improve liveability by optimizing traffic flow and parking, monitoring environmental conditions, and enhancing resident safety. The City welcomes public interaction with the data, but at the moment obtaining the data using the CityIQ API is not intuitive. This project's goal is to provide resources and code to simplify the process of downloading data of interest.

## What data is available?
[This map](https://sandiego.maps.arcgis.com/apps/webappviewer/index.html?id=8d8dcd752def4b55be402fca2760b7a3) shows where sensors are installed across San Diego.

## How do I access the data?
Open San Diego members are creating tools for different purposes. See below for your options

#### Download Traffic/Pedestrian/Bicycle events using Python
Scripts and resources are available in these subdirectories:
* Download_Traffic_Events
* Download_Pedestrian_Events
* Download_Bicycle_Events

Within each of those three subdirectories, you'll see a resources/ subdirectory which contains:
* validated_\[event type\]_sensors.csv - this file has information about each sensor that is currently validated and operational. This list will be updated over the next couple of years (through 2021) as the City reassigns sensors to different functions
* map.txt - this is a text file that links to a Tableau Public map showing the location of all the sensors of that type. You can use this to decide which sensors you would like to analyze
* Sensor_List.txt - you need to edit this text file to list the `assetUid`s of the sensors you want data from 

The scripts all work the same way. Using the Download_Traffic_Events scripts as an example, these are the steps you take:
1. Edit the Download_Traffic_Events/resources/Sensor_List.txt so that it contains the full `assetUid` names of each sensor you want data from
2. Run Update_Traffic_data.py

This will create a subdirectory for each sensor (labeled with the first part of the assetUid code) in your local data/ subdirectory. This will contain:
* a Download_Traffic_Events/data/raw/ directory that contains CSV files of <b>all</b> of the data from that sensor. Sensor data is collected in 30-second chunks, and is saved for a single month at a time
* one CSV file that has data aggregated per hour
* one CSV file that has data aggregated per day

#### Explore the CityIQ APIs using Postman
1. (Optional) Download this CityIQ repository: [https://github.com/CityIQ/OnBoarding]  
   You get a lot of documentation if you download the repo, but you really only need to download these two files: **NEW-CityIQ-OnBoarding-Collection-PostMigration.postman_collection.json** and **New-Environment-Please-Complete-Independently.postman_environment.json**
   
2. Download and install [Postman](https://www.postman.com/downloads/)
  
3. Open Postman  
   a. Click the 'Import' button on the top left (*Insert jpeg here*)  
      * Drag and drop your downloaded **New-Environment-Please-Complete-Independently.postman_environment.json** file here
      * Go to the drop-down menu on the top right and select 'New-Environment-Please-Complete-Independently' (*Insert jpeg here*)
      * Click the eye logo on the top right ('Environment quick look') (*Insert jpeg here*)
      * Edit the `CURRENT VALUE` of the following variables. **NOTE** Some of these values change periodically. Look in the City documentation for the new values if necessary:  
         - `client_id` : PublicAccess
         - `client_secret` : qPKIadEsoHjyh226Snz7 (this is changed every 3 months; see [the City website](https://www.sandiego.gov/sustainability/energy-and-water-efficiency/programs-projects/smart-city) for the new value)
         - `tenant` : sandiego
         - `parking_zone_id` : SD-IE-PARKING
         - `traffic_zone_id` : SD-IE-TRAFFIC
         - `ped_zone_id` : SD-IE-PEDESTRIAN
         - `env_zone_id` : SD-IE-ENVIRONMENTAL
      * Click the eye logo again to close this window
      
   b. Click the 'Import' button on the top left 
      * Drag and drop your downloaded **NEW-CityIQ-OnBoarding-Collection-PostMigration.postman_collection.json** file here
      
   c. Expand the 'NEW-CityIQ-OnBoarding-Collection-PostMigration folder on the left
      * Expand the Tokens folder
      * Select 'GET client Token'
      * Click the 'SEND' button on the right  
        This returns an access token that is good for 24 hrs. You will need to repeat this step on each day you want to work with the CityIQ API (you don't need to repeat steps a or b)

   d. Now you're ready to query the streetlights database!

## Other resources for working with the data
* **Time** - if you want to download data from a specific timeframe, you have to specify the start and end times (`startTime` and `endTime`) in milliseconds since January 1, 1970 00:00:00 UTC. You can use [this website to convert back and forth](https://currentmillis.com/).
* **Location** - if you want to limit your search to a geographic location, you have to enter boundary box information in latitude and longitude (`bbox`). The default `bbox` set in the environment variables list is -90:-180,90:180, which is the entire world. (*We need resources for ways to get that information. [Here's one](https://gps-coordinates.org/coordinate-converter.php), but you need to have a specific address*)

## Official guides, FAQs, etc
* [CityIQ documentation](https://docs.cityiq.io/Default.htm)
* [Detailed description of data types](https://github.com/CityIQ/OnBoarding/blob/master/API-Maps.pdf) available for each category. You might have to download this pdf to get it to open.
* CityIQ's [basic guide to working with Postman](https://github.com/CityIQ/OnBoarding/blob/master/OnBoarding_CityIQ_Postman_and_FAQ.pdf) (with examples of GET requests)
* The City of San Diego's [Smart Streetlights overview](https://www.sandiego.gov/sustainability/energy-and-water-efficiency/programs-projects/smart-city)
