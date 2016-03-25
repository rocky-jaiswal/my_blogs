---
title: "Packer, Ansible and Docker"
tags: Docker
date: 26/03/2016
---

A [little while back](http://rockyj.in/2015/09/06/docker_capistrano.html) we looked at an operational setup that can get us up and running with any simple application by using Docker and capistrano. What was missing was the setup of the machine itself, we __do not__ want to __manually__ set up Docker and other related infrastructure on any machine. So we will use [Ansible](https://www.ansible.com/) to do the work for us. Ansible is really powerful, feature packed and simple at the same time.

A simple Ansible playbook to setup a machine with Docker and other software needed for a capistrano deployment may look like (blog.yml) -


    - name: Setup blog server
      hosts: blog-server
      become: yes
      become_method: sudo
      vars:
      ssh_port: 22

      pre_tasks:
        - name: install fail2ban
          apt: name=fail2ban update_cache=yes

        - name: install ufw
          apt: name=ufw update_cache=yes

        - name: install curl
          apt: name=curl update_cache=yes

        - name: install git
          apt: name=git update_cache=yes

        - name: create a sudo user
          user: name=rockyj shell=/bin/bash home=/home/rockyj groups=sudo append=yes

        - name: create a user for deployment
          user: name=app shell=/bin/bash home=/home/app groups=www-data append=yes

      roles:
        - role: docker_ubuntu
          ssh_port: "{{ ssh_port }}"

      post_tasks:
        - name: add sudo user to docker group
          user: name=rockyj groups=docker append=yes

        - name: add deploy user to docker group
          user: name=app groups=docker append=yes

        - name: add ssh keys
          authorized_key: user=rockyj key=https://github.com/rocky-jaiswal.keys

        - name: add ssh keys - 2
          authorized_key: user=app key=https://github.com/rocky-jaiswal.keys

        - name: restart docker
          service: name=docker state=restarted

The [docker-ubuntu](https://galaxy.ansible.com/angstwad/docker_ubuntu/) downloadable role does the grunt job of installing docker and built-in Ansible modules do the rest for us. At the end of this we can point Ansible to any host and get a server up and ready for capistrano deployment in no time.

We can build upon this further by creating a __machine image__ on top of this setup using [Packer](https://packer.io), which is _an open source tool for creating identical machine images for multiple platforms from a single source configuration._ The advantage of this is that once we have these images built we can have a server up and running with all the software / configuration we need in no time. This is also useful when we need a cluster setup and most machines are identical to each other. What is even more cool with Packer is that it is provider independent, so with one single configuration we can build images for EC2, DigitalOcean and others at the same time. Let us look at a sample Packer configuration for our setup (packer.json) -

    {
      "provisioners": [
        {
          "type": "ansible",
          "playbook_file": "./blog.yml",
          "host_alias": "blog-server"
        }
      ],

      "builders": [
        {
          "type": "amazon-ebs",
          "access_key": "AKIAJF3BOE6UISH6D3PB",
          "secret_key": "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",
          "region": "eu-central-1",
          "source_ami": "ami-87564feb",
          "instance_type": "t2.micro",
          "ssh_username": "ubuntu",
          "ami_name": "packer-myblog {{timestamp}}"
        },
        {
          "type": "digitalocean",
          "api_token": "ebac67f4ee4b097686e67624aeeaf7dgt45tgec653399ecbe46a58d622f4bbcc4",
          "image": "ubuntu-14-04-x64",
          "region": "fra1",
          "size": "512mb"
        }
      ]
    }

_Please note that the keys above are not real_. When we run -

    packer build packer.json

Packer will build machine images for us on EC2 and DigitalOcean, all we need to do then is to go to our hosting provider (EC2 or DigitalOcean) and start a server using the image we just built and in a few seconds we have a server ready for capistrano deployment. Isn't that just awesome!
