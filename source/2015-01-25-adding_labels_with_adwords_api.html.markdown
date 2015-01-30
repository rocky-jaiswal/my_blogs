---
title: "Adding Labels with Adwords API"
tags: Ruby, Adwords
date: 25/01/2015
---

The Adwords API is a beast, although it is well [documented](https://developers.google.com/adwords/api/) it can take a while to wrap your head around it. Release v201406 of the API added support to manage Labels, this was further improved in v201409. Labels are a great tool to add metadata to Adwords Keywords, they can help in organizing, filtering and performing bulk actions on the the Adwords interface.

Labels can be applied to keywords, campaigns, ad groups, and ads, which also enables you to see how the custom categories you create are performing relative to each other and to the entities in your account. Labels provide an easy filtering mechanism also on the Adwords interface as seen in the screenshot below -

![Adwords_Labels_Filtering](/images/adwords_label_filtering.png "Labels in Adwords")

More information on Labels can be found in this [post](https://support.google.com/adwords/answer/2475865?hl=en). We here at [crealytics](http://www.crealytics.com/en/home.html) use [camato](www.camato.de/en) to manage large Adwords accounts and use Labels to effectively manage data. This blog post provides some guidance to add Labels to Keywords programmatically with Ruby, since this feature of the API is thinly documented I believe this post might help some developers out there.

On a web browser this might look something like this -

![Adding Labels](/images/add_labels_adwords.png "Adding Labels to Adwords Keywords")

This post makes a few assumptions -

1. You have basic Adwords API knowledge.
2. You have signed-up for the API and have the necessary credentials, in Ruby we usually put these in a YAML file.
3. You have OAuth2 tokens to work with the API.

So lets start with the first class, which helps us read the static API config -

	module Adwords
	  class Config

	    ADWORDS_STATIC_CONFIG_FILE = "adwords_static_config.yml"

	    def self.static_config
	      static_file_path = File.join(Rails.root, "config", ADWORDS_STATIC_CONFIG_FILE)
	      YAML.load(File.read(static_file_path))
	    end

	  end
	end

Using the static config and merging it with our account specific OAuth config, we can create an Adwords service builder -

	require 'adwords_api'

	class AdwordsServiceBuilder

	  def self.service(adwords_id, service_name)
	    config = self.config_hash(adwords_id)
	    adwords_api = AdwordsApi::Api.new(config)
	    adwords_api.service(service_name, adwords_api.config.read('api_version').to_sym)
	  end

	  private

	  def self.config_hash(adwords_id)
	    config = Adwords::Config.static_config
	    oauth2_config = OAuthHandler.request_token(adwords_id).adwords_oauth2_token_config
	    #Merge static and Oauth2 config
	    config[:authentication][:oauth2_token] = oauth2_config
	    config[:authentication][:client_customer_id] = adwords_id
	    config
	  end

	end

Using this service builder we can create a Label management service -

	  class Labels

	    def initialize(adwords_id)
	      @label_service = AdwordsServiceBuilder.service(adwords_id, :LabelService)
	    end

	    #returns the id of the found / created label
	    def find_or_create_label(label_text)
	      response = label_service.get({fields: ['LabelName']})
	      label_entry = find_label_entry(response, label_text)
	      label_entry = create_label(label_text) unless label_entry
	      label_entry[:id]
	    rescue AdwordsApi::Errors::ApiException, AdsCommon::Errors::HttpError => e
	      Rails.logger.error "Errors while finding creating labels #{e.message}"
	      Rails.logger.error "e.backtrace.join('\n')"
	      raise e
	    end

	    private

	    attr_reader :label_service

	    def create_label(label_text)
	      response = label_service.mutate([{operator: 'ADD',
		                                 operand: {xsi_type: 'TextLabel',
		                                   name: label_text}
		                               }])
	      response[:value].first
	    end

	    def find_label_entry(response, label_text)
	      if response[:entries].present?
		response[:entries].find{|e| e[:name] == label_text}
	      end
	    end

	  end

The Labels class provides a __find_or_create__ method which first looks for a label by its text in an Adwords account and if it is not found creates one. For Label creation the operation in the code above is __label_service.mutate__ which uses the [Google Adwords API Ruby gem](https://github.com/googleads/google-api-ads-ruby) to interact with the LabelService. Adwords API operates primarily as a SOAP service, however dealing with SOAP requests / response is clunky so we use the Ruby gem which provides a nice abstraction over raw SOAP calls for us.

Now that we have created a Label, let us associate it with a Keyword -

	  class AdGroupCriterionService

	    def initialize(keyword)
	      @keyword = keyword
	    end

	    def update_with_label(label_id)
	      ignore_label_exists_exception do
		service.mutate_label([add_label_operation(label_id)])
	      end
	    end

	    private

	    attr_reader :label_id, :keyword

	    def service
	      AdwordsServiceBuilder.service(keyword.adwords_id, :AdGroupCriterionService)
	    end

	    def add_label_operation(label_id)
	      {
		xsi_type: "AdGroupCriterionLabelOperation",
		operator: 'ADD',
		operand: {
		  ad_group_id:  keyword.adgroupid,
		  criterion_id: keyword.id,
		  label_id:     label_id
		}
	      }
	    end

	    def ignore_label_exists_exception(&block)
	      begin
		block.call
	      rescue AdwordsApi::Errors::ApiException, AdsCommon::Errors::ApiException => e
		if e.message.match(/AD_GROUP_CRITERION_LABEL_ALREADY_EXISTS/)
		  Rails.logger.warn("Trying to add a label which is already there")
		else
		  raise e
		end
	      end
	    end
	  end

To associate a Label with a Keyword, we use the __AdGroupCriterionService__ with the __mutate_label__ operation. We also have a __Keyword__ model which we create to manage the keywords downloaded from Adwords. 

The sample (Rails) Keyword model can look like this -

	class Keyword < ActiveRecord::Base
	  belongs_to :account

	  delegate :adwords_id, to: :account

	  def update_label_in_adwords(label_text)
	    label_id = Adwords::Labels.new(self.adwords_id)
		                      .find_or_create_label(label_text)
	    Adwords::AdGroupCriterionService.new(self).update_with_label(label_id)
	  end
	end


So the controller's job is as simple as doing -

	keyword = Keyword.find(params['keyword_id'].to_i)
	keyword.update_label_in_adwords(params['label_text'])


That is it, using the excellent Adwords API gem we have been able to create Labels and associate them with Keywords elegantly. The main gotchas are to build the services correctly, call the correct operations and pass them with the appropriate parameters. Hope the code above will help some developers out there, the same principles can be used to interact with Adwords API with other programming languages such as Python / Java.
