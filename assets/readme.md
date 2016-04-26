This ship enriches customer profiles using [Datanyze](https://datanyze.com)

Fetch 3rd party data from Datanyze and writes it back into the customer profile.

# Setup

- Go to your [Datanyze dashboard](https://www.datanyze.com/domains/). Find your API key, Paste it into your Hull Dashboard. Enter your account email

- The Datanyze ship is using the domain_info api. It looks for the `datanyze.domain` property and searches additional info for it if it's not already there.

- To fill in this data, you usually use the Computed Traits ship to write it after having extracted it from one of your other existing traits.

For instance this is what you could write in the Computed Traits ship: 

```js
const email_domain = (user.email || user.contact_email).split('@')[1];
const datanyze_domain = (user.traits_datanyze||{}).domain;
const website_domain = (user.traits_website||"").replace(/https?:\/\//,'');
return {
  'datanyze': {
    'domain': datanyze_domain || website_domain || email_domain
  }
}
```
