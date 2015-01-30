---
title: "Experiments with Adwords Scripts"
tags: Ruby, Adwords
date: 01/02/2015
---

[Adwords Scripts](https://developers.google.com/adwords/scripts/) are a neat way to automate small tasks in Adwords. There are many scripts [available](https://developers.google.com/adwords/scripts/docs/solutions/) which can help you automate routine tasks or run some basic checks on your Adwords account. However, there are also some [limits](https://developers.google.com/adwords/scripts/docs/limits) on what can be done with Scripts. For example, the script must do its job in 30 minutes or it is cancelled, also there is no way to invoke the Scripts via Adwords API.

But there are two great features that come with Adwords Scripts - one that they can be scheduled and another that they can access Google Drive. Which gives me an idea, we can ask to script to do a scheduled check on a file in Google Drive and on certain conditions (either based on the presence or on content of the file) do some action. Since the idea sounds exciting, lets do an experiment to see if it actually works.

For our experiment we will do something trivial, we want to automate the process of adding "Negative Keywords" to a campaign. Negative Keywords according to Google is - _A type of keyword that prevents your ad from being triggered by a certain word or phrase. It tells Google not to show your ad to anyone who is searching for that phrase_.

So we want to collect all our Negative Keywords, paste them in an awesome tool like [camato](www.camato.de/en), click a button and sit back and relax. Something like this -

![Adding Negative Keywords](/images/add_negative_keywords.png "Adding Negative Keywords")

What will happen in the background is -

1. Our tool will upload the negative keywords to Google Drive as a file.
2. Our Adwords script will periodically read the file.
3. Using the Adwords API the script will add the keywords to our campaign.

So let us first look at the code to upload the keywords as a file in Google Drive. The code assumes you have setup Drive API access with [Google Developers Console](https://console.developers.google.com/project).


	require 'google/api_client'

	class GoogleDrive

	  PATH = Rails.root.join('tmp', "negative_keywords.txt")

	  def initialize
	    initialize_client
	  end

	  def get_authorization_url
	    client.authorization.authorization_uri
	  end

	  def store_keywords(content)
	    File.open(PATH, "w") do |file|
	      content.each{|line| file.puts(line + "\n")}
	    end
	  end

	  def authorize_client(auth_code)
	    client.authorization.code = auth_code
	    client.authorization.fetch_access_token!
	  end

	  def upload_file
	    file = drive.files
		        .insert.request_schema
		        .new({
		               'title' => 'Negative_Keywords',
		               'description' => 'negative keywords for google adwords script',
		               'mimeType' => 'text/plain'
		             })
	    media = Google::APIClient::UploadIO.new(PATH.to_s, 'text/plain')
	    result = client.execute(
		                    :api_method => drive.files.insert,
		                    :body_object => file,
		                    :media => media,
		                    :parameters => {
		                      'uploadType' => 'multipart',
		                      'alt' => 'json'
		                    })
	    result.data
	  end

	  private

	  attr_reader :client

	  def initialize_client
	    @client = Google::APIClient.new
	    @client.authorization.client_id     = static_config[:client_id]
	    @client.authorization.client_secret = static_config[:client_secret]
	    @client.authorization.scope         = static_config[:scope]
	    @client.authorization.redirect_uri  = "http://localhost:3000/oauth_callback"
	    @client
	  end

	  def drive
	    client.discovered_api('drive', 'v2')
	  end

	  def static_config
	    Rails.application.config.google_api_config.deep_dup
	  end

	end


When we sign up with the Google API, we are assigned a client id and client secret. The code above assumes that these two entities are set in Rails.config. Since uploading to Google drive requires OAuth tokens, we first need to authorize our customers and then do the upload. On the controller level, it may look like this -


	class NegativeKeywordsController < ApplicationController

	  def new
	  end

	  def create
	    negative_keywords = params['negative_keywords'].split("\n")

	    google_drive = GoogleDrive.new
	    google_drive.store_keywords negative_keywords
	    uri = google_drive.get_authorization_url

	    redirect_to uri.to_s
	  end

	  #we can make this action our OAuth callback for now
	  def upload
	    google_drive = GoogleDrive.new
	    google_drive.authorize_client params['code']
	    result = google_drive.upload_file
	    #check the result if you want
	    flash[:notice] = "Negative Keywords uploaded!"
	    redirect_to action: 'new'
	  end

	end


Running this code will upload a file to the authorized user's Google Drive. We need to make sure that this user can also access our Adwords account + execute the Adwords script to get the permissions right.


Lets us now write a small Adwords script to use this file -

	function addNegativeKeywordsToCampaigns(keywords_csv) {
          //Get all accounts for our MCC
	  var accounts = MccApp.accounts().get();
	  
	  while (accounts.hasNext()) {
	    // Select the client account.
	    var account = accounts.next();
	    MccApp.select(account);
	    
	    // Select all campaigns under the client account
	    var campaignIterator = AdWordsApp.campaigns().get();
	    
	    if (campaignIterator.hasNext()) {
	      var campaign = campaignIterator.next();
	      var kws = Utilities.parseCsv(keywords_csv);
	      for (var i = 0; i < kws.length; i++) {
		var row = kws[i];
		Logger.log('Adding Keyword: ' + row[0] + ' to Campaign Name: ' + campaign.getName());
		campaign.createNegativeKeyword(row[0]);
	      }
	    }
	  }
	}

	function getFileContentsFromDrive() {
	  var filesIterator = DriveApp.getFilesByName('Negative_Keywords');
	  var file = filesIterator.next();
	  var data = file.getBlob().getDataAsString()
	  Logger.log(data);
	  return data;
	}

	function main() {
	  var kws = getFileContentsFromDrive();
	  addNegativeKeywordToCampaigns(kws);
	}


As with all Adwords scripts, the entry point is the _function main()_. We first fetch the contents of the file from Google drive and then we pass the keywords over to be added to all Campaigns in our Account. If your account is an MCC like ours, you will need to iterate over all Accounts as well (as shown in code above). 

We can now add this script via the Adwords UI and schedule it -

![Adding Adwords Scripts](/images/adding_adwords_scripts.png "Adding Adwords Scripts")


And when the script runs, it will add new Negative Keywords to our Campaigns -

![Adwords Negative Keywords](/images/adwords_negative_keywords.png "Adwords Negative Keywords")


That's it! We have added Negative Keywords using Adwords Scripts while not opening the Adwords interface at all. Please note that the code above is experimental and not meant for production use (since not all validations / checks are in place and things are hardcoded). The idea was to see how we can work with Adwords Scripts from outside the Adwords interface, which I believe was successful.
