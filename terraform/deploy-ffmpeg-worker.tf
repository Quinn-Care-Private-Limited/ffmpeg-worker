# ec2_instance.tf

provider "aws" {}


# variable "efs_id" {
#   default = "fs-0b35353805dd428a2"
# }

variable "ami_id" {
  default = "ami-01ab57ff9ab89de28"
}

variable "instance_type" {
  default = "c7g.12xlarge"
}

variable "key_pair_name" {
  default = "ec2-maintainer"
}

# Create an EFS file system
resource "aws_efs_file_system" "ffmpeg_efs" {
  creation_token   = "ffmpeg-efs"
  performance_mode = "generalPurpose"

  tags = {
    Name = "ffmpeg-efs"
  }
}



data "aws_subnets" "public" {
  filter {
    name   = "tag:Name"
    values = ["quinnvpcsubnet*"]
  }
}

# Create a security group
resource "aws_security_group" "ffmpeg_security_group" {
  name        = "ffmpeg-security-group"
  description = "Allow SSH and HTTP traffic"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_efs_mount_target" "ffmpeg_efs_mount" {
  file_system_id  = aws_efs_file_system.ffmpeg_efs.id
  subnet_id       = data.aws_subnets.public.ids[0]
  security_groups = [aws_security_group.ffmpeg_security_group.id]
}


# Ensure EC2 instance is created after EFS mount target
resource "aws_instance" "ffmpeg-worker" {
  subnet_id              = data.aws_subnets.public.ids[0]
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.ffmpeg_security_group.id] # Attach security group

  tags = {
    Name = "ffmpeg-worker"
  }

  ebs_block_device {
    device_name = "/dev/sdf"
    volume_size = 10
    volume_type = "gp2"
  }


  lifecycle {
    create_before_destroy = true
  }


  user_data = <<-EOF
    #!/bin/bash -ex
    sudo mkdir -p /mnt/efs
    sudo mount -t nfs4 -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport ${aws_efs_mount_target.ffmpeg_efs_mount.file_system_id}.efs.us-east-2.amazonaws.com:/ /efs
    sudo chown -R ubuntu /mnt/efs
    npm install -g @quinnincy/ffmpeg-worker
  EOF


  depends_on = [aws_efs_mount_target.ffmpeg_efs_mount]
}
