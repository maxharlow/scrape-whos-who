Scrape Who's Who
================

[Who's Who] (http://www.ukwhoswho.com/) publish 'the essential directory of the noteworthy and influential in every area of public life'. This scrapes each into a CSV.

Requires [Node] (http://nodejs.org/).

Expects a configuration file named `config.json`, where a library card number is given, as shown in `config.example.json`. The library card number is used to log in to Who's Who before scraping begins. If you have institutional access, which means access is granted by IP range and there's no need to log in, then this field can be left blank.

Install the dependencies with `npm install`, then run `node whos-who`.
