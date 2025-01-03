--- 
title: "Experiments with elasticsearch"
tags: Ruby, Elasticsearch
date: 24/06/2014
---

During the last few weeks I got the opportunity to work with elasticsearch and I am pretty impressed with the feature set and performance it provides. Elasticsearch's ability to work with structured or unstructured queries, easy cluster setup and speed make it an interesting candidate for a NoSQL DB or even a cache over a relational DB. On the down side the documentation is a bit thin for beginners and the official guide is still not 100% complete. In this blog we will work a way thorugh the qurey API in a step by step manner which might be useful for beginners (and maybe my own self six months down the line).

Assuming you have elasticsearch running on localhost, we can set it up with some data. In our example we will use a small dataset of mobile phones which any webstore can have.

Our simple rake task to create an index, mapping and index some records looks like -

    namespace :experiment do

      CLIENT        = Elasticsearch::Client.new log: true
      INDEX_NAME    = 'phones'
      MAPPING_NAME  = 'phone'

      desc "setup ES with some data"
      task :setup => :environment do
        CLIENT.indices.delete index: INDEX_NAME

        CLIENT.indices.create index: INDEX_NAME, body: {
          mappings: {
            MAPPING_NAME => {
              properties: {
                brand: {
                  type: 'string'
                },
                model: {
                  type: 'string'
                },
                availability: {
                  type: 'string', analyzer: 'keyword'
                },
                tags: {
                  type: 'string', analyzer: 'keyword'
                }
              }
            }
          }
        }

        phones = [
          {
            id: 1,
            brand: "Samsung",
            model: "Galaxy S5",
            availability: "in stock",
            tags: ["Android 4.4.2", "4.2 inches", "Quad 1.6 Ghz"]
          },
          {
            id: 2,
            brand: "Samsung",
            model: "Galaxy S4",
            availability: "in stock",
            tags: ["Android 4.4.1", "4.2 inches", "Quad 1.3 Ghz"]
          },
          {
            id: 3,
            brand: "Samsung",
            model: "Galaxy S4 mini",
            availability: "out of stock",
            tags: ["Android 4.4.1", "3.2 inches", "Single 1.3 Ghz"]
          },
          {
            id: 4,
            brand: "Samsung",
            model: "Galaxy S3",
            availability: "in stock",
            tags: ["Android 4.4.0", "4.0 inches", "Quad 1.0 Ghz"]
          },
          {
            id: 5,
            brand: "Motorola",
            model: "Moto E",
            availability: "in stock",
            tags: ["Android 4.4.0", "4.0 inches", "Dual 1.2 Ghz"]
          },
          {
            id: 6,
            brand: "Motorola",
            model: "Moto G",
            availability: "out of stock",
            tags: ["Android 4.4.0", "4.1 inches", "Dual 1.2 Ghz"]
          },
          {
            id: 7,
            brand: "Motorola",
            model: "Moto X",
            availability: "in stock",
            tags: ["Android 4.4.2", "4.2 inches", "Quad 1.4 Ghz"]
          },
          {
            id: 8,
            brand: "Sony",
            model: "Xperia E",
            availability: "out of stock",
            tags: ["Android 4.4.0", "3.6 inches", "Single 1.2 Ghz"]
          },
          {
            id: 9,
            brand: "Sony",
            model: "Xperia L",
            availability: "in stock",
            tags: ["Android 4.4.0", "4.1 inches", "Dual 1.2 Ghz"]
          },
          {
            id: 10,
            brand: "Sony",
            model: "Xperia X",
            availability: "in stock",
            tags: ["Android 4.4.2", "4.2 inches", "Quad 1.4 Ghz"]
          }
        ]

        # Index them one by one
        # phones.each do |phone|
        #   CLIENT.index index: 'phones',
        #                type: 'phone',
        #                body: phone
        # end

        # or use the bulk api
        CLIENT.bulk({
          body: phones.map do |phone|
            { index: { _index: INDEX_NAME, _type: MAPPING_NAME, _id: phone[:id], data: phone} }
          end
        })
      end
    end

The reason we used different analyzers for tags and availability is because they are more like keywords on which we do not want to run any tokenization or stemming. 

Let's run a few queries now, you can run them via the marvel plugin or via Ruby.

####Get phones with the brand sony -

    GET /phones/_search
    {
      "query": {
        "term": {
          "brand": "sony"
        }
      }
    }

Ruby code for the query above would be -

    client = Elasticsearch::Client.new
    client.search(index: 'phones', body:{ query:{term:{brand:"samsung"}} })

####Get phones with the brand samsung and which have the tag 'Android 4.4.2' -

    GET /phones/_search
    {
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "brand": "samsung"
              }
            },
            {
              "match": {
                "tags": "Android 4.4.2"
              }
            }
          ]
        }
      }
    }

Ruby code -

    query = {
      bool: {
        must: [
          { match: { brand: "samsung" } },
          { match: { tags: "Android 4.4.2" } }
        ]
      }
    }
    client.search(index: 'phones', body:{ query: query })

####A "filtered" search -

    GET /phones/_search
    {
      "query": {
        "filtered": {
          "filter": {
            "bool": {
              "must": [
                {
                  "term": {
                    "availability": "in stock"
                  }
                },
                {
                  "term": {
                    "brand": "sony"
                  }
                }
              ]
            }
          }
        }
      }
    }

In most common cases, users will just type in a phrase and we need it to match across fields, in this case we use the 

####Multi-field search -

    GET /phones/_search
    {
      "query": {
        "multi_match": {
          "query": "samsung galaxy s5",
          "type":  "cross_fields",
          "fields": ["brand", "model", "tags"],
          "minimum_should_match": "70%"
        }
      }
    }

####Using a filter on a multi-field search -

    GET /phones/_search
    {
      "query": {
        "filtered": {
          "query": {
            "multi_match": {
              "query": "samsung galaxy",
              "type":  "cross_fields",
              "fields": ["brand", "model", "tags"],
              "minimum_should_match": "80%"
            }
          },
          "filter": {
            "term": {
              "availability": "in stock"
            }
          }
        }
      }
    }

Hope these sample queries will provide an eazy way to get started with Elasticsearch. Happy searching!