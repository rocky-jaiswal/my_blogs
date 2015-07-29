set :application, "my_blogs"
set :repository,  "https://github.com/rocky-jaiswal/my_blogs.git"

set  :scm, :git
set  :user, "deploy"
set  :ip, "46.101.199.125"
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
    run "cd #{deploy_to}/current && docker build --rm=true --no-cache=false -t rockyj/my_blogs ."
    run "docker stop my_blogs"
    run "docker rm -fv my_blogs"
    run "docker run -tid -p 80:80 --name my_blogs rockyj/my_blogs"
  end
end
