import re
import csv
import requests
from bs4 import BeautifulSoup

for i in range(1, 40178, 20):
    data = []
    request = requests.get('http://www.ukwhoswho.com/browse/people/paginate/' + str(i))
    soup = BeautifulSoup(request.text)
    results = soup.find(id = 'content').find('ul').find_all('li')
    for result in results:
        uri = result.find('h3').find('a').get('href')
        identifier = re.search('whoswho/(.*?)/', uri).group(1)
        name = result.find('h3').find('a').get_text(strip=True)
        bio = result.find('span').get_text().strip('()')
        entry = {'id': identifier, 'name': name, 'bio': bio}
        data.append(entry)
    with open('whos-who.csv', 'a+') as file:
        writer = csv.DictWriter(file, ['id', 'name', 'bio'])
        writer.writerows(data)
