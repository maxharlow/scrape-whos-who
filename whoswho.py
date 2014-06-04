import re
import csv
import time
import requests
from bs4 import BeautifulSoup

for i in range(1, 40178, 20):
    print('Scraping records beginning ' + str(i))
    data = []
    request = requests.get('http://www.ukwhoswho.com/browse/people/paginate/' + str(i))
    soup = BeautifulSoup(request.text)
    results = soup.find(id = 'content').find('ul').find_all('li')
    for result in results:
        uri = result.h3.a.get('href')
        identifier = re.search('whoswho/(.*?)/', uri).group(1)
        name = result.h3.a.get_text(strip=True)
        life = "".join([x.get_text() if not isinstance(x, str) else x for x in result.h3.a.next_siblings]).strip()
        bio = result.find('span', class_='occ').string
        entry = {'id': identifier, 'name': name, 'life': life, 'bio': bio}
        data.append(entry)
    with open('whos-who.csv', 'a+') as file:
        writer = csv.DictWriter(file, ['id', 'name', 'life', 'bio'])
        writer.writerows(data)
    time.sleep(10)
