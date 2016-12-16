# Hull ♥ Datanyze

Upgrade Hull with data from Datanyze

[Datantyze](https://www.datanyze.com/) is data provider for B2B for customers to query for companies and employees at companies. It has a particular focus on technographics - what tools and technologies a company is using

#### Datanyze data includes:

- Individual identities (name, email, company, location…)
- Company identities (name, location, employees, revenues, technologies…) including technographics

#### Power your other tools with Datanyze data

With Hull, you can query Datanyze and use the data to enrich profiles in other tools.

Hull can then send those enriched profiles to other tools in native forms including:

- Salesforce
- HubSpot
- Intercom
- Facebook Custom Audiences

Hull can also use that data to add contacts to segments - instance using job title data from Dataynze to create a segment of “VP Marketing - Mailchimp User”. That segment can then be shared with:

- HubSpot
- Optimizely
- Slack (trigger a notification)
- Facebook Custom Audiences

#### More power and control over your Datanyze data

Hull also gives you more flexibility with your data from Datanyze. It enables you to sort, segment, score and combine data from multiple sources and send it straight to the tools they’re needed in a useful format.

- No APIs to tap into
- No code needed
- No import/export
- No complexity
- No repetitive workflow creation

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
