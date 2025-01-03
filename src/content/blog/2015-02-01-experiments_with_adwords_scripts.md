---
title: "Experiments with Adwords Scripts"
tags: Ruby, Adwords
date: 01/02/2015
---

[Adwords Scripts](https://developers.google.com/adwords/scripts/) are a neat way to automate small tasks in Adwords. There are many scripts [available online](https://developers.google.com/adwords/scripts/docs/solutions/) which can help you automate routine tasks or run some basic checks on your Adwords account. However, there are also some [limits](https://developers.google.com/adwords/scripts/docs/limits) on what can be done with Scripts. For example, the script must do its job in 30 minutes or it is canceled, also there is no way to invoke the Scripts via Adwords API.

However, there are two great features that come with Adwords Scripts - one that they can be scheduled and another that they can access Google Drive. Which gives me an idea, we can ask to script to do a scheduled check on a file in Google Drive and on certain conditions (either based on the presence or on content of the file) do some action. Since the idea sounds exciting, lets do an experiment to see if it actually works.

For our experiment we will do something trivial, we want to automate the process of adding "Negative Keywords" to a campaign. Negative Keywords according to Google is - _A type of keyword that prevents your ad from being triggered by a certain word or phrase. It tells Google not to show your ad to anyone who is searching for that phrase_.

So we want to collect all our Negative Keywords, paste them in an awesome tool like [camato](www.camato.de/en), click a button and sit back and relax. Something like this -

![Adding Negative Keywords](/images/add_negative_keywords.png "Adding Negative Keywords")

What will happen in the background is -

1. Our tool will upload the negative keywords to Google Drive as a file.
2. Our Adwords script will periodically read the file.
3. The script will parse the uploaded file and add the keywords to our campaign.

So let us first look at the code to upload the keywords as a file in Google Drive. We will use the [google-api-client gem](https://github.com/google/google-api-ruby-client) for making our lives easier, we assume that you have setup Drive API access on [Google Developers Console](https://console.developers.google.com/project).

    #models/concerns/google_api.rb
    require 'google/api_client'

    module GoogleApi

      def initialize_client
        client = Google::APIClient.new
        client.authorization.client_id = static_config[:client_id]
        client.authorization.client_secret = static_config[:client_secret]
        client.authorization.scope = static_config[:scope]
        client.authorization.redirect_uri = "http://localhost:3000/oauth_callback"
        client
      end

      def get_authorization_url
        client.authorization.authorization_uri
      end

      def authorize_client(auth_code)
        client.authorization.code = auth_code
        client.authorization.fetch_access_token!
      end

      def static_config
        Rails.application.config.google_api_config.deep_dup
      end

    end

    #models/google_drive.rb

    class GoogleDrive

      include GoogleApi

      def initialize
        @client ||= initialize_client
      end

      def upload_file
        file = drive.files.insert
                          .request_schema
                          .new({
                           'title' => 'Negative_Keywords',
                           'description' => 'negative keywords for google adwords script',
                           'mimeType' => 'text/plain'
                           })
        media = Google::APIClient::UploadIO.new(TempStorage::PATH.to_s, 'text/plain')
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

      def drive
        client.discovered_api('drive', 'v2')
      end

    end


    #models/temp_storage.rb
    #We use a temp file for now. In actual production code, the keywords
    #can probably go in a database
    class TempStorage

      PATH = Rails.root.join('tmp', "negative_keywords.txt")

      def self.store_keywords(content)
        File.open(PATH, "w") do |file|
          content.each{|line| file.puts(line + "\n")}
        end
      end

    end


When we sign up with the Google API, we are assigned a client id and client secret. The code above assumes that these two entities are set in Rails.config. Since uploading to Google drive requires OAuth tokens, we first need to authorize our customers before we execute the upload. For this experiment, we store the negative keywords given by the user in a temporary file and then upload it on Google Drive. On the controller level, it may look like this -


    class NegativeKeywordsController < ApplicationController

      def new
      end

      def create
        negative_keywords = params['negative_keywords'].split("\n")
        TempStorage.store_keywords negative_keywords
        uri = GoogleDrive.new.get_authorization_url

        redirect_to uri.to_s
      end

      #for now this can be our OAuth callback action
      def upload
        google_drive = GoogleDrive.new
        google_drive.authorize_client params['code']
        google_drive.upload_file
        redirect_to action: 'new'
      end

    end


Running this code will upload a file to the authorized user's Google Drive. We need to make sure that this user can also access our Adwords account + execute the Adwords script to get the permissions right (the Adwords script should be able to access the Google Drive file).


Lets us now write a small Adwords script to use this file and add negative keywords to campaign/s -

	function addNegativeKeywordsToAllCampaigns(keywords_csv) {
      //Get all accounts for our MCC
	  var accounts = MccApp.accounts().get();

      //Iterate over the accounts
	  while (accounts.hasNext()) {
	    // Select the client account.
	    var account = accounts.next();
	    MccApp.select(account);
	    
	    // Select all campaigns under the client account
	    var campaignIterator = AdWordsApp.campaigns().get();
	    if (campaignIterator.hasNext()) {
	      var campaign = campaignIterator.next();
          addNegativeKeywordsToCampaign(campaign, keywords_csv);
	    }
	  }
	}

    function addNegativeKeywordsToCampaign(campaign, keywords_csv) {
      var kws = Utilities.parseCsv(keywords_csv);
	  for (var i = 0; i < kws.length; i++) {
        var row = kws[i];
        Logger.log('Adding Keyword: ' + row[0] + ' to Campaign Name: ' + campaign.getName());
        campaign.createNegativeKeyword(row[0]);
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
	  addNegativeKeywordsToAllCampaigns(kws);
	}


As with all Adwords scripts, the entry point is the _function main()_. We first fetch the contents of the file from Google drive and then we pass the keywords over to be added to all Campaigns in our Account. If your account is an MCC like [ours](http://www.crealytics.com), you will need to iterate over all Accounts as well (as shown in code above).

We can now add this script via the Adwords UI and schedule it -

![Adding Adwords Scripts](/images/adding_adwords_scripts.png "Adding Adwords Scripts")


And when the script runs, it will add new Negative Keywords to our Campaigns -

![Adwords Negative Keywords](/images/adwords_negative_keywords.png "Adwords Negative Keywords")


That's it! We have added Negative Keywords using Adwords Scripts while not opening the Adwords interface. Please note that the code above is experimental and not meant for production use (not all validations / checks are in place and the values are hard-coded). The idea was to see how we can work with Adwords Scripts from outside the Adwords interface, which I believe was successful.
