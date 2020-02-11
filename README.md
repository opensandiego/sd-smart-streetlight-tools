# sd-smart-streetlight-tools

The City of San Diego has installed over 4,000 "intelligent sensors" in streetlights across the entire city. The hope is to leverage the data from these sensors to improve liveability by optimizing traffic flow and parking, monitoring environmental conditions, and enhancing resident safety. The City welcomes public interaction with the data, but at the moment obtaining the data using the CityIQ API is not intuitive. This project's goal is to provide resources and code to simplify the process of downloading data of interest.

## What data is available?
[This map](https://sandiego.maps.arcgis.com/apps/webappviewer/index.html?id=8d8dcd752def4b55be402fca2760b7a3) shows where sensors are installed across San Diego.

## How do I access the data?
The goal of this project is to create tools that make it easier to download the data. Until then, this is the procedure:
1. (Optional) Download this CityIQ repository: [https://github.com/CityIQ/OnBoarding]  
   You get a lot of documentation if you download the repo, but you really only need to download these two files: **NEW-CityIQ-OnBoarding-Collection-PostMigration.postman_collection.json** and **New-Environment-Please-Complete-Independently.postman_environment.json**
   
2. Download and install [Postman](https://www.postman.com/downloads/)  
   You may have to create a free Postman account to get this to work (*I'm not sure, someone verify please?*)
  
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

## Resources for working with the data
* **Time** - if you want to download data from a specific timeframe, you have to specify the start and end times (`startTime` and `endTime`) in milliseconds since January 1, 1970 00:00:00 UTC. You can use [this website to convert back and forth](https://currentmillis.com/).
* **Location** - if you want to limit your search to a geographic location, you have to enter boundary box information in latitude and longitude (`bbox`). The default `bbox` set in the environment variables list is -90:-180,90:180, which is the entire world. (*We need resources for ways to get that information. [Here's one](https://gps-coordinates.org/coordinate-converter.php), but you need to have a specific address*)

## Official guides, FAQs, etc
* [CityIQ documentation](https://docs.cityiq.io/Default.htm)
* [Detailed description of data types](https://github.com/CityIQ/OnBoarding/blob/master/API-Maps.pdf) available for each category. You might have to download this pdf to get it to open.
* CityIQ's [basic guide to working with Postman](https://github.com/CityIQ/OnBoarding/blob/master/OnBoarding_CityIQ_Postman_and_FAQ.pdf) (with examples of GET requests)
* The City of San Diego's [Smart Streetlights overview](https://www.sandiego.gov/sustainability/energy-and-water-efficiency/programs-projects/smart-city)
