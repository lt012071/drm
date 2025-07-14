terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Terraform Cloudまたはローカルで状態管理
  # backend "s3" {
  #   bucket = "drm-terraform-state"
  #   key    = "terraform.tfstate"
  #   region = "ap-northeast-1"
  # }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPCとネットワーク
module "vpc" {
  source = "./modules/vpc"
  
  project_name     = var.project_name
  environment      = var.environment
  vpc_cidr         = var.vpc_cidr
  availability_zones = var.availability_zones
}

# ECS クラスター
module "ecs" {
  source = "./modules/ecs"
  
  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  private_subnet_ids    = module.vpc.private_subnet_ids
  
  # アプリケーション設定
  backend_image         = var.backend_image
  frontend_image        = var.frontend_image
  backend_port          = var.backend_port
  frontend_port         = var.frontend_port
  
  # データベース接続情報
  database_url          = module.database.database_url
  redis_url             = module.database.redis_url
  
  # 環境変数
  environment_variables = var.environment_variables
}

# データベース（RDS + Redis）
module "database" {
  source = "./modules/database"
  
  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  app_security_group_id  = module.ecs.app_security_group_id
  
  db_username = var.db_username
  db_password = var.db_password
}

# Route53とACM（SSL証明書）
module "dns" {
  source = "./modules/dns"
  
  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
  alb_dns_name = module.ecs.alb_dns_name
  alb_zone_id  = module.ecs.alb_zone_id
}