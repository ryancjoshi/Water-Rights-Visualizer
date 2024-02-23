from os import makedirs
import shutil
import sys
from os.path import join, exists
import logging
from time import sleep
import json

logger = logging.getLogger(__name__)

def write_status(status_filename: str, message: str):
    logger.info(message)

    with open(status_filename, "w") as file:
        file.write(message)

def main(argv=sys.argv):
    logger.info("running backend")
    config_filename = argv[1]
    logger.info(f"config file: {config_filename}")

    with open(config_filename, "r") as file:
        config = json.load(file)

    name = config["name"]
    logger.info(f"name: {name}")
    start_year = int(config["start_year"])
    logger.info(f"start year: {start_year}")
    end_year = int(config['end_year'])
    logger.info(f"end year: {end_year}")
    working_directory = config["working_directory"]
    logger.info(f"working directory: {working_directory}")
    geojson_filename = config["geojson_filename"]
    logger.info(f"GeoJSON file: {geojson_filename}")
    status_filename = config["status_filename"]
    logger.info(f"status file: {status_filename}")

    for year in range(start_year, end_year + 1):
        write_status(status_filename, f"processing {name} {year}")
        sleep(10)
        image_filename_source = join("test_images", f"{year}_test_target.png")

        if not exists(image_filename_source):
            write_status(status_filename, f"no image produced for {name} for year {year}")
            continue

        image_directory = join(working_directory, "output", "figures")
        makedirs(image_directory, exist_ok=True)
        image_filename_destination = join(image_directory, f"{year}_{name}.png")
        shutil.copy(image_filename_source, image_filename_destination)
    
    write_status(status_filename, f"completed {name} from {start_year} to {end_year}")

if __name__ == "__main__":
    sys.exit(main(argv=sys.argv))