---
title: A weekend with CouchDB, Solr and Torquebox
tags: CouchDB, NoSQL, Torquebox, Solr
date: 27/12/2011
---

Ok, I am lying it was actually a long weekend and I had something working beforehand (but that was before I knew Ruby or really understood how to write decent Ruby code, I am just a little bit better now). I am really excited about JRuby, it has a bright future ahead once JDK 7 matures and InvokedDynamics stabilizes. So I decided to write a new application in JRuby and serve it with [Torquebox](http://torquebox.org/). For data persistence I chose CouchDB.

With RVM and JDK in place I installed JRuby, installing Torquebox is as simple as doing -

        rvm jruby
        jruby -J-Xmx1024m -S gem install torquebox-server --pre

Create a new Rails application as normal. Go to the root folder of that application and do -

        torquebox deploy
        and
        torquebox run

You application will now be served from port 8080 and works like a normal Rails application. Since I did not use any relational DB I disabled activerecord in application.rb.

The application I made helps users in searching for verses in the Bible. So I downloaded and cleansed a pure text version of King James translation and wrote a script to store every verse as a CouchDB document.

Since I also wanted search, I decided to use Solr. The catch with Solr is that there is hardly any documentation available. I decided to go with the Solr "example" setup. So you do a -

        java -jar start.jar

In the Solr example directory. The Solr config for this is located in the "solr" sub-directory.

Next, I wanted to index each verse (a document in CouchDB) with Solr. In my gemfile, I included the "RSolr" and "Couchrest" gem, they provide a nice layer of abstraction over CouchDB and Solr. Next I wrote a Rake task -

        namespace :solr do

        desc "Send docs from CouchDB to Solr for indexing"
        task :setup => :environment do
        db = CouchRest.database("http://localhost:5984/the_bible")
        data = db.view("verse/lookup")['rows']

        solr = RSolr.connect :url => 'http://localhost:8983/solr'

        data.each do |record|
          id = record['id']
          value = record['value']
          solr.add(:id => id, :verse => value)
        end
        solr.update :data => '<commit/>'
        end

        desc "Search for verse - just for testing setup"
        task :search => :environment do
        solr = RSolr.connect :url => 'http://localhost:8983/solr'
        response = solr.get 'select', :params => {
            :q=>'verse:Jesus',
            :start=>0,
            :rows=>10
        }
        puts response.inspect
        end

        end

Basically, the setup task queries a CouchDB view (which returns all the verses) and using RSolr I submit these documents to Solr, note that documents in both CouchDB and Solr use the same id, this helps me in retrieval later.

Basically, I got this idea as both CouchDB and Solr speak JSON. So I can store documents in CouchDB and retrieve them as JSON and store the same JSON in Solr for searching.

In Solr, I am submitting my documents with the field name "verse", this requires a change in Solr schema. I realized this after a lot of head-banging. Just open schema.xml and add a new field "verse" with the type "free_text". There are already some examples present, you can't go wrong.

That's it for simple read-only data we are all done. If your data is updatable, on each update of CouchDB write a background job that updates Solr as well.

My site is available at - [here](http://biblefind.in) and the whole source code on [github](https://github.com/rocky-jaiswal/biblefind).

