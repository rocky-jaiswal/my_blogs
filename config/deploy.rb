set :application, "my_blogs"
set :repository,  "https://github.com/rocky-jaiswal/my_blogs.git"

set  :scm, :git
set  :user, "deploy"
set  :use_sudo, false
set  :deploy_via, :remote_cache
set  :branch, "master"
set  :deploy_to, "/home/#{user}/my_blogs"
role :web, "198.211.98.21"                          # Your HTTP server, Apache/etc
role :app, "198.211.98.21"                          # This may be the same as your `Web` server
role :db,  "198.211.98.21", :primary => true # This is where Rails migrations will run

# if you want to clean up old releases on each deploy uncomment this:
after "deploy:restart", "deploy:cleanup"
after "deploy:cleanup", "custom:build"

namespace :custom do
  task :build do
    puts "==================Building with Middleman======================" #Line 22
    run "cd #{deploy_to}/current && bundle install --deployment"
    run "cd #{deploy_to}/current && bundle exec middleman build"
  end
end
