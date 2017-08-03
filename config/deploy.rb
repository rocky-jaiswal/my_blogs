set :application, "my_blogs"
set :repository,  "https://github.com/rocky-jaiswal/my_blogs.git"

set  :scm, :git
set  :user, "app"
set  :ip, "45.76.90.48"
set  :use_sudo, false
set  :deploy_via, :remote_cache
set  :branch, "master"
set  :deploy_to, "/home/#{user}/my_blogs"
role :web, "#{ip}"                          # Your HTTP server, Apache/etc
role :app, "#{ip}"                          # This may be the same as your `Web` server
role :db,  "#{ip}", :primary => true # This is where Rails migrations will run

after "deploy:restart", "deploy:cleanup"
after "deploy:cleanup", "custom:build"

namespace :custom do
  task :build do
    puts "==================Building with Middleman======================"
    run "/home/app/blog.sh"
  end
end
