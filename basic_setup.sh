passwd

apt-get update
apt-get upgrade

apt-get install -y fail2ban
apt-get install -y ufw
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

useradd deploy
passwd deploy

mkdir /home/deploy
mkdir /home/deploy/my_blogs
mkdir /home/deploy/.ssh

chmod 700 /home/deploy/.ssh
chown -R deploy /home/deploy
chown -R deploy /home/deploy/.ssh

useradd rockyj
passwd  rockyj

mkdir /home/rockyj
chown -R rockyj /home/rockyj

usermod -aG sudo rockyj

su -l rockyj

wget -qO- https://get.docker.com/ | sh
sudo usermod -aG docker rockyj
sudo usermod -aG docker deploy
