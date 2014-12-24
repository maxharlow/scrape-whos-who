Scrape Who's Who
================

[Who's Who] (http://www.ukwhoswho.com/) publish 'the essential directory of the noteworthy and influential in every area of public life'. To access, you need to either subscribe yourself, or access it from a library or other institution that does. This scrapes those records into a CSV.

Requires either version 2 or 3 of [Python] (https://www.python.org/), including `virtualenv` and `pip`.

Set up a virtual environment with `virtualenv venv --no-site-packages` followed by `source venv/bin/activate`. Install the dependencies with `pip install -r requirements.txt`, then run `python whos-who.py`.
