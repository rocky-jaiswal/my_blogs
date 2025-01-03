---
title: Using RVM on Ubuntu to install (multiple versions of) Ruby
tags: Ruby
date: 14/04/2011
---

Recently I got a new laptop and as usual I installed Ubuntu on it, although for the last year or so I was using <a href="http://www.pclinuxos.com/" target="_blank">PCLinuxOS</a> it felt good to go back to an old friend. The first job at hand was to install Ruby on it.

I wanted to install Ruby 1.9.2 since it is the latest and recommended version. However in Synaptic I could only find Ruby 1.8.7 (very stable) and Ruby 1.9.1 (not recommended). Then I read about RVM (Ruby Version Manager) and thought I would give it a spin.

To install RVM you first need Git, as RVM downloads the source code from Github and builds from there. So head over to Synaptic and install Git.

Before you install RVM (and I learned this from after a lot of tries) also install some other packages -

__sudo apt-get install curl gcc g++ build-essential libssl-dev libreadline5-dev zlib1g-dev linux-headers-generic libsqlite3-dev__

If you do not do this you can still install RVM but if you try and run IRB it complains about Readline and some other stuff.

Next, as given in RVM's <a href="https://rvm.beginrescueend.com/" target="_blank">website</a> run -

__$ bash &lt; &lt;(curl -s https://rvm.beginrescueend.com/install/rvm)__

This will download and compile RVM and may take a few minutes.

Once RVM is installed, run -

__. "$HOME/.rvm/scripts/rvm"__

This will "Source" the RVM script and load the rvm command as a function.

Now simply run -

__rvm install 1.9.2__

This will install 1.9.2 version of Ruby.

You can also install another version by simply typing -

__rvm install 1.8.7__

And once you are done, just say -

__rvm use 1.9.2__
or
__rvm use 1.8.7__

And accordingly the Ruby environment will be loaded. You can check the version by just typing

__ruby -v__

To make a Ruby version default (will save you the use command) run

__rvm --default use 1.9.2__ # This is a double hyphen/dash

With this whenever you source the rvm script, Ruby 1.9.2 will be loaded automatically.

Last step is sourcing the rvm script (. "$HOME/.rvm/scripts/rvm") automatically every time you log in. Ideally you should be able to put this in your bash_login script but I tried that and it didn't work. Anyone who has met success with this can comment on this post, it would a great help. Otherwise you just have to make a habit of running __. "$HOME/.rvm/scripts/rvm"__ before you want to use Ruby.

To install the latest version of Rails or some other gems you would first need to update your gem system, you can do this by typing -

__gem update --system__# This is a double hyphen/dash

Now you are good to go crazy with Ruby on your new system!
