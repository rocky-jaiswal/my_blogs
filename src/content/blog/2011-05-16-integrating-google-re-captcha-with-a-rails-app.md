---
title: Integrating Google Re-Captcha with a Rails app
tags: Ruby, Rails
date: 16/05/2011
---

So you want to use re-captcha in your Rails application to avoid bots spamming your site, look no further -

In your Rails 3 gem file add the **gem "scaffoldhub"**

Do a - **bundle install**

Lets say you want to create a comment page with re-captcha so that you save on spam -

**rails generate scaffoldhub comment name:string email:string comment_text:text --scaffold comments_captcha**

You will get the model, controller and view generated for creating a re-captcha secured comment.

Finally to make the re-captcha work, you need to do these steps -

Add **include ReCaptcha::AppHelper** in your ApplicationController before the line before protect_from_forgery.

Add **include ReCaptcha::ViewHelper** in your ApplicationHelper.

**Sign up to http://www.google.com/recaptcha and get you re-captcha keys.** Add them in config/environment.rb -

**RCC_PUB='abc_your_key' **# Please use keys for your own domain
**RCC_PRIV='xyz_your_key' **# Please use keys for your own domain

Remember to do a db:migrate and restart your server (as we changed environment.rb). Your re-captcha is configured and ready to use!
