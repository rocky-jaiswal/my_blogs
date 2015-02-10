---
title: "Managing Adwords URLs"
tags: Adwords
date: 10/02/2015
---

Managing URLs in Adwords can be quite a daunting task. A mid-sized online shop can have thousands of URLs for items it is selling, larger shops like Amazon may have millions of URLs on their website. While setting up ads in Google Adwords each ad needs to point to a URL, of-course the URL should be working and associated correctly with the relevant ad. For example an ad for adidas shoes will look strange with the URL www.example.com/adidas-clothes. 

When we start an AdGroup we upload the keywords that we want to bid on and then create the associated Ads for them. Each Ad will have a -

- Display URL: The webpage address that appears with your ad, typically shown in green text.
- Destination URL: The URL address of the page in your website that people reach when they click your ad. This usually comprises of two parts -
  - Landing Page URL: The actual URL that the users will see in their browsers when they click on the ad.
  - Tracking Information: Parameters for tracking, custom parameters etc.

A restriction is also applied that the domain of the Display URL should be the same as the Destination URL (redirects to the domain are allowed). Destination URLs allow you to have a URL which may have more information (like the source of the traffic) while keeping the user visible URLs clean and simple. Typically when creating an Ad, this may look like -


![Creating Ads](/images/creating_ads.png "Creating Ads")


Things get more interesting as you want more insights on how your ads are performing. For example, you want to see which keyword resulted in a hit on a certain URL or which keywords get more clicks than the others. Adwords provides an interesting feature called [__ValueTrack__](https://support.google.com/adwords/answer/2375447) that can append certain dynamic parameters to the Destination URL. For example to see which keyword triggered the ad click your Destination URL can look like __http://www.example.com/?keyword={keyword}__, Adwords makes sure of substituting the {keyword} with the actual value when the ad click occurs. The shop can then query the keyword parameter when the URL is requested and update the counter of the clicks associated with that keyword.

As you can imagine doing this manually for thousands of keywords / ads can get _quite_ challenging, this is where a tool like [camato](www.camato.de/en) can help you. [camato](www.camato.de/en) can setup large campaigns with just a few clicks and track the keyword performance without you writing a single line of code, but more on that later.

Since tracking the performance of keywords is very important and almost all campaigns need some sort of click tracking, Adwords recently announced that managing Destination URLs is about to get easier. Like I mentioned above, typically the Destination URL comprises of two parts - the landing page URL and the tracking information. With the latest changes announced by Google, you can now work independently on these two parts -

1. The landing page URL is now known as __Final URL__.
2. The tracking information can now be built as a template, so you can apply the template to the whole Adwords Account or one/many campaign/s or one/many Ad group/s.

The advantage of this new feature is that it makes it really easy to add tracking parameters by just applying the "tracking templates". What's more if you make a change in the template and re-apply it, the ads will __not__ be resubmitted for review. This is a huge advantage as earlier minor change in tracking parameters would have caused the entire ad to be submitted for review, effectively making it ineligible for display to the users. With tracking templates you will no longer lose that traffic for the review period.

A simple example can explain this further -

Let's say that you own a sports store, and you have specified a destination URL for the keyword "football cleats". Your destination URL might look something like this (with tracking content highlighted) right now :

- __http://www.3rdpartytracker.com/rd?keyword={keyword}&ad={creative}__&url=http%3A%2F%2Fwww.example.com%2Fshoes%3Fstyle%3Dfootball_cleats

You can now set up your new upgraded URLs this way:

  - Set a Final URL to http://www.example.com/shoes?style=football_cleats
  - Use the {lpurl} ValueTrack parameter to reference that final URL
  - Set your tracking template to http://www.3rdpartytracker.com/rd?keyword={keyword}&ad={creative}&url={lpurl}

Then, when someone searches for "football cleats" AdWords puts together the URL your ad links to, by replacing {lpurl} with the final URL, and {keyword} with "football cleats" and {creative} with the Ad ID.

Making changes to your tracking template at any level—except at the ad level will not send your ad through the approval process i.e. your ad will continue to serve, uninterrupted. If you change the tracking template at the ad level directly, the ad needs to go through the approval process again.

Additionally, Adwords added new ValueTrack parameters like __{loc_physical_ms}__: The ID of the geographical location of the click and __{loc_interest_ms}__: The ID of the location of interest that helped trigger the ad among others.

Apart from all this now we can also create custom parameters which you can add to keywords so that you can send additional tracking information which is not provided by the standard ValueTrack parameters. For example, adding a custom Keyword ID is super easy now.

With these changes it is apparent how serious Google Adwords is taking customer requests which allow for easier tracking and performance measurement. At [crealytics](http://www.crealytics.com/en/home.html) we use all these features to give you great insights into your ad performance and thereby applying visible improvements to your Adwords Campaigns.

