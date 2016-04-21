
# Hull Datanyze Ship.

Enrich customer profiles using [Datanyze](https://datanyze.com)

If you want your own instance: [![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/hull-ships/hull-datanyze)

End-Users: [See Readme here](https://dashboard.hullapp.io/readme?url=https://hull-datanyze.herokuapp.com)
---

### Using :

- Go to your `Hull Dashboard > Ships > Add new`
- Paste the URL for your Heroku deployment, or use ours : `https://hull-datanyze.herokuapp.com/`
- Enter the Datanyze API Key and username
- Go to Datanyze and save the following webhook url: `https://hull-datanyze.herokuapp.com/datanyze`

### Developing :

- Fork
- Install

```sh
npm install -g gulp
npm install
gulp
```
